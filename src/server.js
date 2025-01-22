import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fetchWorkspaceData } from './fetchData.js';
import { parseDataToGraph } from './parseData.js';
import { calculateWorkspaceScore, calculateMaxDepth, calculateDetailedMetrics, calculateWorkspaceHealth, calculateAnalytics } from './utils.js';
import { Client } from '@notionhq/client';
import session from 'express-session';
import axios from 'axios';
import { AIInsightsService } from './services/aiService.js';
import fs from 'fs';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// Load environment variables from .env file
dotenv.config();

// Define constants
const PORT = process.env.PORT || 3000;
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;

// Verify environment variables are loaded
console.log('Environment check:', {
    hasNotionId: !!CLIENT_ID,
    hasNotionSecret: !!CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    redirectUri: REDIRECT_URI
});

// Verify required environment variables
const requiredEnvVars = [
    'NOTION_CLIENT_ID',
    'NOTION_CLIENT_SECRET',
    'SESSION_SECRET'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        if (varName === 'SESSION_SECRET') {
            console.error('Please generate a secure SESSION_SECRET using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
        }
        if (varName !== 'OPENAI_API_KEY') {
            process.exit(1);
        }
    }
});

const app = express();

// Initialize storage file
const STORAGE_FILE = path.join(process.cwd(), 'hex_results.json');
try {
    if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({}));
        console.log('Created storage file:', STORAGE_FILE);
    } else {
        console.log('Storage file exists:', STORAGE_FILE);
    }
} catch (error) {
    console.error('Error initializing storage file:', error);
}

// Helper functions for storage
function saveResults(results) {
    try {
        const stringified = JSON.stringify(results);
        fs.writeFileSync(STORAGE_FILE, stringified);
        console.log('Successfully saved results to file:', {
            fileSize: stringified.length,
            path: STORAGE_FILE
        });
    } catch (error) {
        console.error('Error saving results to file:', error);
        throw error;
    }
}

function loadResults() {
    try {
        if (!fs.existsSync(STORAGE_FILE)) {
            console.log('Storage file does not exist:', STORAGE_FILE);
            return {};
        }
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        console.log('Successfully loaded results from file:', {
            fileSize: data.length,
            path: STORAGE_FILE
        });
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading results:', error);
        return {};
    }
}

let graphCache = null; // Cache to store graph data temporarily
const hexResultsStore = new Map(); // Rename the store to avoid conflict

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname))); // This will serve files from the src directory

// Add MIME type for ES modules
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Add debug logging for file paths
app.use((req, res, next) => {
    console.log('Requested URL:', req.url);
    console.log('Server root directory:', __dirname);
    next();
});

// Add session middleware before your routes
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'  // Protect against CSRF
    }
}));

// Add this near the top of the file with other middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Notion OAuth Redirect
app.get('/auth', (req, res) => {
    console.log('Auth endpoint hit, redirecting to Notion OAuth with:', {
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI
    });

    if (!CLIENT_ID) {
        console.error('Missing NOTION_CLIENT_ID environment variable');
        return res.status(500).send('Server configuration error');
    }

    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    console.log('Redirecting to:', authUrl);
    res.redirect(authUrl);
});

// Callback Endpoint for OAuth
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const response = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
        }, {
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            }
        });

        req.session.notionToken = response.data.access_token;
        res.redirect('/redirect.html');
    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Redirect Page
app.get('/redirect', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'redirect.html'));
});

// API endpoint with better error handling
app.get('/api/data', async (req, res) => {
    try {
        console.log('Session check:', {
            hasSession: !!req.session,
            hasToken: !!req.session.notionToken
        });

        if (!req.session.notionToken) {
            console.error('No token found in session');
            return res.status(401).json({ 
                error: 'No authentication token found. Please authenticate with Notion.' 
            });
        }

        const notion = new Client({
            auth: req.session.notionToken
        });

        // Test the token with a simple API call
        try {
            await notion.users.me();
        } catch (error) {
            console.error('Token validation failed:', error.message);
            return res.status(401).json({ 
                error: 'Invalid or expired token. Please authenticate again.' 
            });
        }

        // Fetch and validate graph data
        const graph = await fetchWorkspaceData(notion);
        
        if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
            console.error('Invalid graph structure:', graph);
            return res.status(500).json({ 
                error: 'Failed to generate valid graph structure' 
            });
        }

        // Calculate metrics
        console.log('Calculating metrics for graph:', {
            nodeCount: graph.nodes.length,
            linkCount: graph.links.length
        });

        const workspaceMetrics = {
            score: calculateWorkspaceScore(graph),
            totalPages: graph.nodes.length,
            activePages: graph.nodes.filter(n => {
                if (!n.lastEdited) return false;
                const lastEdit = new Date(n.lastEdited);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return lastEdit >= thirtyDaysAgo;
            }).length,
            maxDepth: calculateMaxDepth(graph.nodes),
            totalConnections: graph.links.length
        };
        
        console.log('Calculated metrics:', workspaceMetrics);

        res.json({
            graph,
            metrics: workspaceMetrics,
            score: workspaceMetrics.score
        });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this endpoint temporarily for debugging
app.get('/debug-env', (req, res) => {
    res.json({
        hasSecret: !!process.env.NOTION_CLIENT_SECRET,
        secretLength: process.env.NOTION_CLIENT_SECRET?.length || 0
    });
});

// Add a debug endpoint to check session
app.get('/debug-session', (req, res) => {
    res.json({
        hasToken: !!req.session.notionToken,
        sessionData: req.session
    });
});

// Metrics Page
app.get('/metrics', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'metrics.html'));
});

// Metrics API endpoint
app.get('/api/metrics', async (req, res) => {
    try {
        if (!req.session.notionToken) {
            return res.status(401).json({ error: 'No authentication token found' });
        }

        const notion = new Client({
            auth: req.session.notionToken
        });

        const graph = await fetchWorkspaceData(notion);
        console.log('Fetched graph data:', {
            nodeCount: graph.nodes.length,
            linkCount: graph.links.length
        });

        const metrics = calculateDetailedMetrics(graph);
        const health = calculateWorkspaceHealth(graph);

        res.json({
            workspaceScore: metrics.workspaceScore,
            lastUpdated: metrics.lastUpdated,
            totalContent: metrics.metrics.totalPages,
            scores: metrics.scores,
            metrics: metrics.metrics,
            health: health,
            recommendations: metrics.recommendations
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Analytics Page
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'analytics.html'));
});

// Analytics API endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        if (!req.session.notionToken) {
            return res.status(401).json({ error: 'No authentication token found' });
        }

        const notion = new Client({
            auth: req.session.notionToken
        });

        const days = parseInt(req.query.days) || 30;
        const graph = await fetchWorkspaceData(notion);

        console.log('Fetching analytics for graph:', {
            nodeCount: graph.nodes.length,
            linkCount: graph.links.length,
            days: days
        });

        const analytics = calculateAnalytics(graph, days);

        if (!analytics) {
            throw new Error('Failed to calculate analytics');
        }

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

const aiService = new AIInsightsService();

app.get('/api/insights', async (req, res) => {
    try {
        console.log('Fetching AI insights...');
        if (!req.session?.notionToken) {
            throw new Error('Authentication required');
        }

        const notion = new Client({
            auth: req.session.notionToken
        });

        const workspaceData = await fetchWorkspaceData(notion);
        console.log('Workspace data fetched, generating insights...');

        const insights = await aiService.generateWorkspaceInsights(workspaceData);
        console.log('Insights generated successfully');

        res.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ 
            error: 'Failed to generate insights',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Insights Page
app.get('/insights', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'insights.html'));
});

// Visualizer Page
app.get('/visualizer', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'visualizer.html'));
});

// GenNotion Page
app.get('/gennotion', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'gennotion.html'));
});

// Add Hex API integration
const HEX_API_TOKEN = '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e';
const HEX_PROJECT_ID = '21c6c24a-60e8-487c-b03a-1f04dda4f918';

app.post('/api/generate-report', async (req, res) => {
    try {
        const { _input_text } = req.body;
        
        console.log('Received generate-report request:', {
            workspaceId: _input_text,
            projectId: HEX_PROJECT_ID
        });
        
        if (!_input_text) {
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        const hexUrl = `https://app.hex.tech/api/v1/project/${HEX_PROJECT_ID}/run`;
        console.log('Calling Hex API:', {
            url: hexUrl,
            projectId: HEX_PROJECT_ID,
            inputText: _input_text
        });

        // Call Hex API to run the project with properly formatted parameters
        const hexResponse = await axios.post(
            hexUrl,
            {
                inputParams: {
                    _input_text: _input_text
                },
                updatePublishedResults: false,
                useCachedSqlResults: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${HEX_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Hex API response:', {
            status: hexResponse.status,
            data: hexResponse.data,
            runId: hexResponse.data?.run_id
        });

        res.json({
            success: true,
            runId: hexResponse.data.run_id,
            status: hexResponse.data.status
        });

    } catch (error) {
        console.error('Error in generate-report endpoint:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            details: error.response?.data?.details
        });
        
        const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: errorMessage
        });
    }
});

// Add this endpoint to receive Hex results
app.post('/api/hex-results', async (req, res) => {
    try {
        const results = req.body;
        console.log('Received Hex results:', {
            hasData: !!results.data,
            dataframe2Length: results.data?.dataframe_2?.length,
            dataframe3Keys: results.data?.dataframe_3 ? Object.keys(results.data.dataframe_3) : []
        });

        // Store results immediately
        storedResults = {
            data: {
                dataframe_2: results.data?.dataframe_2 || [],
                dataframe_3: results.data?.dataframe_3 || {}
            }
        };

        // Also save to file as backup
        const storedData = {
            timestamp: new Date(),
            data: storedResults.data
        };
        
        try {
            writeFileSync(STORAGE_FILE, JSON.stringify(storedData));
            console.log('Saved results to file:', {
                path: STORAGE_FILE,
                dataSize: JSON.stringify(storedData).length
            });
        } catch (writeError) {
            console.error('Error writing to storage file:', writeError);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing Hex results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Store connected SSE clients
const connectedClients = new Set();

// Add SSE endpoint for streaming results
app.get('/api/hex-results/stream', (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // First try memory-stored results
        if (storedResults && storedResults.data) {
            console.log('Sending memory-stored results');
            res.write(`data: ${JSON.stringify({
                success: true,
                data: storedResults
            })}\n\n`);
        } else {
            // Try reading from file
            try {
                if (existsSync(STORAGE_FILE)) {
                    const fileData = JSON.parse(readFileSync(STORAGE_FILE, 'utf8'));
                    if (fileData && fileData.data) {
                        console.log('Sending file-stored results');
                        res.write(`data: ${JSON.stringify({
                            success: true,
                            data: fileData
                        })}\n\n`);
                    } else {
                        throw new Error('No valid data in storage file');
                    }
                } else {
                    throw new Error('No storage file found');
                }
            } catch (readError) {
                console.error('Error reading stored results:', readError);
                res.write(`data: ${JSON.stringify({
                    success: false,
                    error: 'No results available'
                })}\n\n`);
            }
        }

        res.end();
    } catch (error) {
        console.error('Error in stream endpoint:', error);
        res.status(500).json({ error: 'Stream error' });
    }
});

// Add an endpoint to fetch results
app.get('/api/hex-results', async (req, res) => {
    try {
        const results = loadResults();
        console.log('Fetching stored results:', {
            hasResults: !!results,
            timestamp: results?.timestamp,
            dataLength: results?.data?.length || 0,
            firstRecord: results?.data?.[0]
        });
        
        if (!results || !results.data) {
            return res.status(404).json({ 
                success: false, 
                error: 'Results not found' 
            });
        }

        res.json({
            success: true,
            data: results.data
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add an endpoint to fetch results by runId
app.get('/api/hex-results/:runId', async (req, res) => {
    try {
        const results = loadResults();
        
        if (!results) {
            return res.status(404).json({ 
                success: false, 
                error: 'Results not found' 
            });
        }
        
        console.log('Sending stored results:', {
            timestamp: results.timestamp,
            dataSize: results.data?.length || 0
        });

        // Only send the data, not the metadata
        res.json({
            success: true,
            data: results.data
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add logging endpoint
app.post('/api/log-data', (req, res) => {
    try {
        const { type, data } = req.body;
        const timestamp = new Date().toISOString();
        const logPath = '/opt/render/project/src/logs.json';
        
        // Create log entry
        const logEntry = {
            timestamp,
            type,
            data
        };

        // Read existing logs or create new array
        let logs = [];
        if (fs.existsSync(logPath)) {
            const fileContent = fs.readFileSync(logPath, 'utf8');
            logs = JSON.parse(fileContent);
        }

        // Add new log and keep only last 100 entries
        logs.push(logEntry);
        if (logs.length > 100) {
            logs = logs.slice(-100);
        }

        // Write back to file
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

        console.log('Logged data:', {
            type,
            timestamp,
            dataSize: JSON.stringify(data).length
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add endpoint to view logs
app.get('/api/logs', (req, res) => {
    try {
        const logPath = '/opt/render/project/src/logs.json';
        
        if (!fs.existsSync(logPath)) {
            return res.json({ logs: [] });
        }

        const fileContent = fs.readFileSync(logPath, 'utf8');
        const logs = JSON.parse(fileContent);

        res.json({ logs });
    } catch (error) {
        console.error('Error reading logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add at the top of the file
const MAX_RESULTS_SIZE = 50 * 1024 * 1024; // 50MB limit
let storedResults = null;

// Replace or add the results storage endpoint
app.post('/api/store-results', (req, res) => {
    try {
        // Clear previous results
        if (storedResults) {
            storedResults = null;
        }

        const data = req.body;
        const dataSize = JSON.stringify(data).length;

        if (dataSize > MAX_RESULTS_SIZE) {
            console.warn(`Data size (${dataSize} bytes) exceeds limit (${MAX_RESULTS_SIZE} bytes)`);
            return res.status(413).json({ error: 'Data size too large' });
        }

        // Store new results
        storedResults = data;

        // Log storage
        console.log(`Stored results: ${dataSize} bytes`);
        
        res.json({ success: true, size: dataSize });
    } catch (error) {
        console.error('Error storing results:', error);
        res.status(500).json({ error: 'Failed to store results' });
    }
});

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));