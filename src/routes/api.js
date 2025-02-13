import express from 'express';
import { HexService } from '../services/HexService.js';
import { ResultsManager } from '../services/ResultsManager.js';
import { NotionService } from '../services/NotionService.js';
import { Client } from '@notionhq/client';
import { MetricsCalculator } from '../core/metrics/MetricsCalculator.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'public', 'visualizations');
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
        console.log('Received analyze-workspace request:', {
            body: req.body,
            headers: req.headers['content-type']
        });

        // Log environment variables
        console.log('Notion credentials check:', {
            hasApiKey: !!process.env.NOTION_API_KEY,
            apiKeyLength: process.env.NOTION_API_KEY?.length,
            hasDatabaseId: !!process.env.NOTION_DATABASE_ID,
            databaseId: process.env.NOTION_DATABASE_ID
        });

        const { workspaceId } = req.body;
        
        if (!workspaceId) {
            console.log('Missing workspaceId in request');
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        // Clear any existing results before starting new analysis
        resultsManager.clearResults();
        
        // Initialize Hex service
        const hexService = getHexService();
        
        // Trigger Hex analysis
        const hexResponse = await hexService.triggerHexRun(workspaceId);
        
        if (!hexResponse.success) {
            return res.status(500).json({ 
                success: false, 
                error: hexResponse.error
            });
        }

        // Wait for results to be available (with timeout)
        let attempts = 0;
        const maxAttempts = 30;
        const delay = 5000;

        while (attempts < maxAttempts) {
            const results = resultsManager.loadResults();
            console.log('Checking results:', {
                attempt: attempts + 1,
                hasDataframe2: results?.data?.dataframe_2?.length > 0,
                dataframe2Length: results?.data?.dataframe_2?.length,
                hasDataframe3: !!results?.data?.dataframe_3,
                hasDataframe5: results?.data?.dataframe_5?.length > 0,
                dataframe5Length: results?.data?.dataframe_5?.length,
                isComplete: results?.metadata?.isComplete
            });

            if (results?.data?.dataframe_2?.length > 0 && 
                results?.data?.dataframe_3 && 
                results?.data?.dataframe_5?.length > 0 && 
                results?.metadata?.isComplete) {
                
                // Initialize NotionService if we have credentials
                if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
                    try {
                        console.log('Initializing Notion service and calculating metrics...');
                        
                        const notionClient = new Client({ auth: process.env.NOTION_API_KEY });
                        const notionService = new NotionService(notionClient, process.env.NOTION_DATABASE_ID);

                        // Calculate metrics
                        console.log('Creating MetricsCalculator...');
                        const metricsCalculator = new MetricsCalculator(process.env.NOTION_API_KEY, process.env.NOTION_DATABASE_ID);
                        
                        console.log('Calculating metrics...');
                        const metrics = await metricsCalculator.calculateAllMetrics(
                            results.data.dataframe_2,
                            results.data.dataframe_3,
                            results.data.dataframe_5,
                            workspaceId
                        );
                        
                        console.log('Metrics calculated:', {
                            hasMetrics: !!metrics,
                            metricKeys: metrics ? Object.keys(metrics) : [],
                            sampleMetrics: metrics ? {
                                totalPages: metrics.total_pages,
                                totalMembers: metrics.total_members,
                                contentMaturityScore: metrics.content_maturity_score
                            } : null
                        });

                        // Create Notion entry
                        console.log('Creating Notion entry...');
                        const pageId = await notionService.createNotionEntry(workspaceId, metrics);
                        console.log('Created Notion page:', pageId);

                        return res.json({
                            success: true,
                            runId: hexResponse.runId,
                            results: results,
                            notionPageId: pageId,
                            metrics: metrics // Include metrics in response for debugging
                        });
                    } catch (notionError) {
                        console.error('Error in Notion process:', notionError);
                        console.error('Error stack:', notionError.stack);
                        // Continue with the response even if Notion creation fails
                        return res.json({
                            success: true,
                            runId: hexResponse.runId,
                            results: results,
                            notionError: {
                                message: notionError.message,
                                stack: notionError.stack
                            }
                        });
                    }
                } else {
                    console.log('Notion credentials not found, skipping Notion integration');
                }

                return res.json({
                    success: true,
                    runId: hexResponse.runId,
                    results: results
                });
            }

            console.log('Waiting for results:', {
                attempt: attempts + 1,
                hasDataframe2: results?.data?.dataframe_2?.length > 0,
                hasDataframe3: !!results?.data?.dataframe_3,
                hasDataframe5: results?.data?.dataframe_5?.length > 0,
                isComplete: results?.metadata?.isComplete
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
        }

        return res.status(408).json({
            success: false,
            error: 'Timeout waiting for results'
        });

    } catch (error) {
        console.error('Error analyzing workspace:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
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
        const imageUrl = `${baseUrl}/visualizations/${req.file.filename}`;

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