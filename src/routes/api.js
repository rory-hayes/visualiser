import express from 'express';
import { HexService } from '../services/HexService.js';
import { ResultsManager } from '../services/ResultsManager.js';
import { NotionService } from '../services/NotionService.js';
import { Client } from '@notionhq/client';

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

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Endpoint to receive results from Hex
router.post('/hex-results', express.json({ limit: '50mb' }), async (req, res) => {
    try {
        console.log('Received results from Hex:', {
            chunk: req.body.metadata?.chunk,
            totalChunks: req.body.metadata?.total_chunks,
            success: req.body.success,
            hasDataframe2: !!req.body.data?.dataframe_2,
            hasDataframe3: !!req.body.data?.dataframe_3,
            hasDataframe5: !!req.body.data?.dataframe_5
        });

        if (!req.body.success || !req.body.data || !req.body.metadata) {
            console.error('Invalid results data structure:', req.body);
            return res.status(400).json({ error: 'Invalid results data structure' });
        }

        // Validate required dataframes
        const { data, metadata } = req.body;
        if (!data.dataframe_2 || !data.dataframe_3 || !data.dataframe_5) {
            console.error('Missing required dataframes:', {
                hasDataframe2: !!data.dataframe_2,
                hasDataframe3: !!data.dataframe_3,
                hasDataframe5: !!data.dataframe_5
            });
            return res.status(400).json({ error: 'Missing required dataframes' });
        }

        // Save the results
        const saved = resultsManager.saveResults(req.body);
        if (!saved) {
            return res.status(500).json({ error: 'Failed to save results' });
        }

        const isComplete = resultsManager.isResultsComplete();
        console.log('Results status:', {
            saved: true,
            isComplete,
            chunk: metadata.chunk,
            totalChunks: metadata.total_chunks
        });

        res.json({ 
            success: true,
            isComplete,
            chunk: metadata.chunk,
            totalChunks: metadata.total_chunks
        });
    } catch (error) {
        console.error('Error handling Hex results:', error);
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

        // Debug environment variables
        console.log('Environment variables check:', {
            HEX_API_KEY_length: process.env.HEX_API_KEY?.length,
            HEX_PROJECT_ID: process.env.HEX_PROJECT_ID,
            NODE_ENV: process.env.NODE_ENV
        });

        const { workspaceId } = req.body;
        
        if (!workspaceId) {
            console.log('Missing workspaceId in request');
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        // Initialize service
        try {
            console.log('Initializing Hex service with environment variables:', {
                hasApiKey: !!process.env.HEX_API_KEY,
                hasProjectId: !!process.env.HEX_PROJECT_ID,
                apiKeyLength: process.env.HEX_API_KEY?.length,
                projectId: process.env.HEX_PROJECT_ID
            });

            hexService = getHexService();
        } catch (error) {
            console.error('Failed to initialize Hex service:', error);
            return res.status(500).json({
                success: false,
                error: 'Hex service configuration error',
                details: error.message
            });
        }

        console.log('Analyzing workspace:', workspaceId);
        
        // Clear any existing results before starting new analysis
        resultsManager.clearResults();
        
        const hexResponse = await hexService.triggerHexRun(workspaceId);
        
        console.log('Hex response:', {
            success: hexResponse.success,
            hasRunId: !!hexResponse.runId,
            error: hexResponse.error
        });
        
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
            if (results?.data?.dataframe_2?.length > 0 && 
                results?.data?.dataframe_3 && 
                results?.data?.dataframe_5?.length > 0 && 
                results?.metadata?.isComplete) {
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

export default router; 