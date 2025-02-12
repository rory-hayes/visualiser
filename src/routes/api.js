import express from 'express';
import { HexService } from '../services/HexService.js';
import { ResultsManager } from '../services/ResultsManager.js';
import { NotionService } from '../services/NotionService.js';
import { Client } from '@notionhq/client';
import { MetricsCalculator } from '../core/metrics/MetricsCalculator.js';
import pkg from 'multer';
const { diskStorage } = pkg;
const multer = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const resultsManager = new ResultsManager();

// Initialize services lazily
let hexService = null;

const getHexService = () => {
    if (!hexService) {
        const hexApiKey = process.env.HEX_API_KEY;
        const hexProjectId = process.env.HEX_PROJECT_ID;
        
        if (!hexApiKey || !hexProjectId) {
            throw new Error('Missing required environment variables: HEX_API_KEY and HEX_PROJECT_ID must be set');
        }
        
        hexService = new HexService(hexApiKey, hexProjectId);
    }
    return hexService;
};

// Configure multer for file uploads
const storage = diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'visualizations');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'tree-' + uniqueSuffix + '.png');
    }
});

const upload = multer({ storage: storage });

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Configure express.json middleware with larger limit for the hex-results endpoint
const jsonParser = express.json({
    limit: '100mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON' });
            throw new Error('Invalid JSON');
        }
    }
});

// Endpoint to receive results from Hex
router.post('/hex-results', jsonParser, async (req, res) => {
    try {
        // Log basic info about the incoming chunk without logging the full payload
        console.log('Received results chunk from Hex:', {
            chunk: req.body.metadata?.chunk,
            totalChunks: req.body.metadata?.total_chunks,
            success: req.body.success,
            hasDataframe2: Array.isArray(req.body.data?.dataframe_2),
            dataframe2Length: req.body.data?.dataframe_2?.length || 0,
            hasDataframe3: !!req.body.data?.dataframe_3,
            hasDataframe5: Array.isArray(req.body.data?.dataframe_5),
            dataframe5Length: req.body.data?.dataframe_5?.length || 0,
            payloadSize: JSON.stringify(req.body).length
        });

        if (!req.body.success || !req.body.data || !req.body.metadata) {
            console.error('Invalid results data structure');
            return res.status(400).json({ error: 'Invalid results data structure' });
        }

        const { data, metadata } = req.body;
        const { chunk, total_chunks } = metadata;

        // Validate chunk information
        if (typeof chunk !== 'number' || typeof total_chunks !== 'number' || chunk < 1 || chunk > total_chunks) {
            console.error('Invalid chunk metadata:', { chunk, total_chunks });
            return res.status(400).json({ error: 'Invalid chunk metadata' });
        }

        // Process the chunk in smaller pieces if it's large
        const processChunk = async () => {
            // Save the chunk
            const saved = await new Promise(resolve => {
                process.nextTick(() => {
                    const result = resultsManager.saveResults(req.body);
                    resolve(result);
                });
            });

            if (!saved) {
                throw new Error('Failed to save results chunk');
            }

            return saved;
        };

        await processChunk();

        const isComplete = resultsManager.isResultsComplete();
        console.log('Results chunk status:', {
            saved: true,
            isComplete,
            chunk,
            totalChunks: total_chunks,
            dataframe2Count: data.dataframe_2?.length || 0,
            dataframe5Count: data.dataframe_5?.length || 0
        });

        res.json({ 
            success: true,
            isComplete,
            chunk,
            totalChunks: total_chunks,
            message: isComplete ? 'All chunks received' : `Chunk ${chunk} of ${total_chunks} received`
        });
    } catch (error) {
        console.error('Error handling Hex results chunk:', error);
        res.status(500).json({ error: error.message });
    }
});

// Analyze workspace endpoint
router.post('/analyze-workspace', async (req, res) => {
    try {
        const { authToken } = req.body;
        
        if (!authToken) {
            return res.status(400).json({ error: 'Auth token is required' });
        }

        const notionService = new NotionService(authToken);
        const result = await notionService.analyzeWorkspace();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error analyzing workspace:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate report endpoint
router.post('/generate-report', async (req, res) => {
    try {
        const { workspaceId } = req.body;
        
        if (!workspaceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        const hexService = getHexService();
        const hexResponse = await hexService.triggerHexRun(workspaceId);
        
        if (!hexResponse.success) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to trigger Hex run' 
            });
        }

        resultsManager.saveResults(hexResponse.results);

        res.json({
            success: true,
            runId: hexResponse.runId
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report',
            details: error.message
        });
    }
});

// Stream results endpoint
router.get('/hex-results/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const resultsStream = resultsManager.getResultsStream();
    resultsStream.pipe(res);

    req.on('close', () => {
        resultsStream.destroy();
    });
});

// Create Notion page endpoint
router.post('/create-notion-page', async (req, res) => {
    try {
        const { workspaceId, metrics } = req.body;

        if (!req.session?.notionToken) {
            return res.status(401).json({ error: 'No Notion authentication token found' });
        }

        const notionClient = new Client({ auth: req.session.notionToken });
        const notionService = new NotionService(notionClient, process.env.NOTION_DATABASE_ID);

        const pageId = await notionService.createNotionEntry(workspaceId, metrics);

        res.json({ success: true, pageId });

    } catch (error) {
        console.error('Error creating Notion page:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create Notion page',
            details: error.message
        });
    }
});

// Get Notion configuration endpoint
router.get('/notion-config', (req, res) => {
    if (!req.session?.notionToken) {
        return res.status(401).json({ error: 'No authentication token found' });
    }

    res.json({
        apiKey: req.session.notionToken,
        databaseId: process.env.NOTION_DATABASE_ID
    });
});

// Add upload visualization endpoint
router.post('/upload-visualization', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate public URL for the uploaded file
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const relativePath = path.relative(
            path.join(__dirname, '..', 'public'),
            req.file.path
        ).replace(/\\/g, '/');
        const imageUrl = `${baseUrl}/${relativePath}`;

        console.log('File uploaded successfully:', {
            originalName: req.file.originalname,
            savedPath: req.file.path,
            publicUrl: imageUrl
        });

        res.json({ 
            success: true, 
            imageUrl 
        });
    } catch (error) {
        console.error('Error uploading visualization:', error);
        res.status(500).json({ error: 'Failed to upload visualization' });
    }
});

export default router; 