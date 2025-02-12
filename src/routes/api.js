import express from 'express';
import { HexService } from '../services/HexService.js';
import { ResultsManager } from '../services/ResultsManager.js';
import { NotionService } from '../services/NotionService.js';
import { Client } from '@notionhq/client';

const router = express.Router();
const resultsManager = new ResultsManager();

// Initialize services with environment variables
const hexService = new HexService(
    process.env.HEX_API_KEY,
    process.env.HEX_PROJECT_ID
);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Analyze workspace endpoint
router.post('/analyze-workspace', async (req, res) => {
    try {
        const { workspaceId } = req.body;
        
        if (!workspaceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        console.log('Analyzing workspace:', workspaceId);
        const hexResponse = await hexService.triggerHexRun(workspaceId);
        
        if (!hexResponse.success) {
            console.error('Hex run failed:', hexResponse.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to trigger Hex run',
                details: hexResponse.error
            });
        }

        if (hexResponse.results) {
            resultsManager.saveResults(hexResponse.results);
        }

        res.json({
            success: true,
            runId: hexResponse.runId,
            results: hexResponse.results
        });

    } catch (error) {
        console.error('Error analyzing workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze workspace',
            details: error.message
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