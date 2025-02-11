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
import { MetricsCalculator } from './public/js/gennotion/core/MetricsCalculator.js';

// Load environment variables from .env file
dotenv.config();

// Define constants
const PORT = process.env.PORT || 3000;
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const HEX_API_TOKEN = '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e';

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
        // Validate results before saving
        if (!results || typeof results !== 'object') {
            throw new Error('Invalid results format');
        }

        // Ensure the data is properly structured
        const safeResults = {
            timestamp: new Date().toISOString(),
            data: {
                dataframe_2: Array.isArray(results.data?.dataframe_2) ? results.data.dataframe_2.map(item => {
                    // Clean each item to ensure it's JSON-safe
                    return Object.fromEntries(
                        Object.entries(item || {}).map(([key, value]) => [
                            key,
                            value === undefined ? null : value
                        ])
                    );
                }) : [],
                dataframe_3: results.data?.dataframe_3 ? 
                    JSON.parse(JSON.stringify(results.data.dataframe_3)) : null,
                dataframe_5: Array.isArray(results.data?.dataframe_5) ? results.data.dataframe_5.map(item => {
                    // Clean each item to ensure it's JSON-safe
                    return Object.fromEntries(
                        Object.entries(item || {}).map(([key, value]) => [
                            key,
                            value === undefined ? null : value
                        ])
                    );
                }) : []
            }
        };

        // Write to temporary file first
        const tempFile = `${STORAGE_FILE}.tmp`;
        const stringified = JSON.stringify(safeResults, (key, value) => {
            if (value === undefined) return null;
            if (typeof value === 'bigint') return value.toString();
            if (value instanceof Error) return value.message;
            return value;
        });

        // Validate JSON string before writing
        try {
            JSON.parse(stringified);
        } catch (parseError) {
            console.error('Invalid JSON generated:', parseError);
            throw new Error('Failed to generate valid JSON');
        }

        // Write to temp file and verify
        fs.writeFileSync(tempFile, stringified, 'utf8');
        const verification = fs.readFileSync(tempFile, 'utf8');
        JSON.parse(verification); // Validate JSON is parseable
        
        // If verification passes, move to actual file
        fs.renameSync(tempFile, STORAGE_FILE);

        console.log('Successfully saved results:', {
            fileSize: stringified.length,
            dataframe2Count: safeResults.data.dataframe_2.length,
            hasDataframe3: !!safeResults.data.dataframe_3,
            dataframe5Count: safeResults.data.dataframe_5.length
        });

        return true;
    } catch (error) {
        console.error('Error saving results:', error);
        // Clean up temp file if it exists
        try {
            if (fs.existsSync(`${STORAGE_FILE}.tmp`)) {
                fs.unlinkSync(`${STORAGE_FILE}.tmp`);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
        }
        throw error;
    }
}

function loadResults() {
    try {
        if (!fs.existsSync(STORAGE_FILE)) {
            console.log('Storage file does not exist:', STORAGE_FILE);
            return { 
                timestamp: new Date().toISOString(), 
                data: { 
                    dataframe_2: [], 
                    dataframe_3: null,
                    dataframe_5: []
                } 
            };
        }

        // Read file content
        let fileContent = fs.readFileSync(STORAGE_FILE, 'utf8').trim();
        
        // Handle empty file case
        if (!fileContent || fileContent === '{}') {
            return { 
                timestamp: new Date().toISOString(), 
                data: { 
                    dataframe_2: [], 
                    dataframe_3: null,
                    dataframe_5: []
                } 
            };
        }

        // Attempt to parse with error recovery
        let parsedData;
        try {
            parsedData = JSON.parse(fileContent);
        } catch (parseError) {
            console.error('Initial JSON parse error:', parseError);
            
            // Try to fix common JSON issues
            fileContent = fileContent
                .replace(/[\u0000-\u0019]+/g, '') // Remove control characters
                .replace(/,\s*}/g, '}')           // Remove trailing commas
                .replace(/,\s*\]/g, ']')          // Remove trailing commas in arrays
                .replace(/\\/g, '\\\\')           // Escape backslashes
                .replace(/"\s+"/g, '" "')         // Fix spaces between strings
                .replace(/}\s*{/g, '},{');        // Fix adjacent objects
            
            try {
                parsedData = JSON.parse(fileContent);
            } catch (secondError) {
                console.error('Failed to recover JSON:', secondError);
                // Reset file with empty structure
                const emptyData = { 
                    timestamp: new Date().toISOString(), 
                    data: { 
                        dataframe_2: [], 
                        dataframe_3: null,
                        dataframe_5: []
                    } 
                };
                fs.writeFileSync(STORAGE_FILE, JSON.stringify(emptyData), 'utf8');
                return emptyData;
            }
        }

        // Validate structure
        if (!parsedData || typeof parsedData !== 'object') {
            console.error('Invalid data structure in file');
            return { 
                timestamp: new Date().toISOString(), 
                data: { 
                    dataframe_2: [], 
                    dataframe_3: null,
                    dataframe_5: []
                } 
            };
        }

        // Ensure required structure exists
        const validatedData = {
            timestamp: parsedData.timestamp || new Date().toISOString(),
            data: {
                dataframe_2: Array.isArray(parsedData.data?.dataframe_2) ? parsedData.data.dataframe_2 : [],
                dataframe_3: parsedData.data?.dataframe_3 || null,
                dataframe_5: Array.isArray(parsedData.data?.dataframe_5) ? parsedData.data.dataframe_5 : []
            }
        };

        console.log('Successfully loaded results:', {
            fileSize: fileContent.length,
            dataframe2Count: validatedData.data.dataframe_2.length,
            hasDataframe3: !!validatedData.data.dataframe_3,
            dataframe5Count: validatedData.data.dataframe_5.length
        });

        return validatedData;
    } catch (error) {
        console.error('Error loading results:', error);
        return { 
            timestamp: new Date().toISOString(), 
            data: { 
                dataframe_2: [], 
                dataframe_3: null,
                dataframe_5: []
            } 
        };
    }
}

let graphCache = null; // Cache to store graph data temporarily
const hexResultsStore = new Map(); // Rename the store to avoid conflict

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/visualizations', express.static(path.join(__dirname, 'public', 'visualizations')));
app.use(express.static(path.join(__dirname))); // This will serve files from the src directory

// Add logging middleware for visualization requests
app.use('/visualizations', (req, res, next) => {
    console.log('Visualization request:', {
        path: req.path,
        fullUrl: req.url,
        method: req.method,
        exists: fs.existsSync(path.join(__dirname, 'public', 'visualizations', req.path))
    });
    next();
});

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
    if (req.url.includes('visualizations')) {
        console.log('Visualization request:', {
            url: req.url,
            fullPath: path.join(__dirname, 'public', req.url)
        });
    }
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

// Generate Report Endpoint
app.post('/api/generate-report', async (req, res) => {
    try {
        const { workspaceId, projectId } = req.body;
        
        console.log('Received generate-report request:', req.body);

        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID is required' });
        }

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Call Hex API
        const hexResponse = await callHexAPI(workspaceId, projectId);
        console.log('Hex API response:', hexResponse);

        res.json({ 
            success: true, 
            data: hexResponse.data,
            runId: hexResponse.runId 
        });

    } catch (error) {
        console.error('Error in generate-report:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate report',
            details: error.response?.data
        });
    }
});

async function callHexAPI(workspaceId, projectId) {
    try {
        const url = `https://app.hex.tech/api/v1/project/${projectId}/run`;
        console.log('Calling Hex API:', {
            url,
            projectId,
            workspaceId
        });

        const response = await axios.post(url, {
                inputParams: {
                _input_text: workspaceId
                },
                updatePublishedResults: false,
                useCachedSqlResults: true
        }, {
                headers: {
                    'Authorization': `Bearer ${HEX_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
        });

        if (!response.data || !response.data.runId) {
            throw new Error('Invalid response from Hex API');
            }

        console.log('Hex API response:', {
            status: response.status,
            runId: response.data.runId,
            data: response.data
        });

        return {
            status: response.status,
            data: response.data,
            runId: response.data.runId
        };

    } catch (error) {
        console.error('Error calling Hex API:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        if (error.response?.data?.error) {
            throw new Error(`Hex API Error: ${error.response.data.error}`);
        } else if (error.response?.status === 401) {
            throw new Error('Invalid Hex API key');
        } else if (error.response?.status === 404) {
            throw new Error('Hex project not found');
        } else if (error.response?.status === 400) {
            const details = error.response?.data?.details;
            if (details) {
                console.error('Validation details:', details);
            }
            throw new Error('Invalid request format');
        } else {
            throw new Error(error.message || 'Failed to call Hex API');
        }
    }
}

// Add endpoint for streaming Hex results
app.get('/api/hex-results/stream', (req, res) => {
    try {
        // Set SSE headers with a longer timeout
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=120'
        });

        // Track processing state
        let processingState = {
            lastProcessedIndex: 0,
            totalRecordsSent: 0,
            isProcessing: false
        };

        // Send initial connection message
        res.write('data: {"type":"connected"}\n\n');

        // Function to check for results
        const checkResults = async () => {
            if (processingState.isProcessing) {
                return; // Skip if already processing
            }

            try {
                processingState.isProcessing = true;
                const results = loadResults();
                
                if (!results?.data?.dataframe_2) {
                    processingState.isProcessing = false;
                    return;
                }

                const totalRecords = results.data.dataframe_2.length;
                const CHUNK_SIZE = 500;
                const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

                // Only send progress if we haven't started or if we're resuming
                if (processingState.lastProcessedIndex === 0) {
                    res.write(`data: {"type":"progress","message":"Starting data processing...","totalRecords":${totalRecords},"totalChunks":${totalChunks}}\n\n`);
                }

                // Process remaining data in chunks
                for (let i = processingState.lastProcessedIndex; i < totalRecords; i += CHUNK_SIZE) {
                    const chunk = results.data.dataframe_2.slice(i, Math.min(i + CHUNK_SIZE, totalRecords));
                    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
                    
                    // Send progress update
                    res.write(`data: {"type":"progress","message":"Processing records ${i + 1} to ${Math.min(i + CHUNK_SIZE, totalRecords)}","currentChunk":${chunkNum},"totalChunks":${totalChunks},"recordsProcessed":${i + chunk.length},"totalRecords":${totalRecords}}\n\n`);
                    
                    const chunkData = {
                        success: true,
                        data: {
                            timestamp: results.timestamp,
                            data: {
                                dataframe_2: chunk,
                                dataframe_3: i + CHUNK_SIZE >= totalRecords ? results.data.dataframe_3 : null
                            }
                        },
                        totalChunks,
                        currentChunk: chunkNum,
                        totalRecords,
                        recordsProcessed: i + chunk.length,
                        isLastChunk: i + CHUNK_SIZE >= totalRecords
                    };

                    try {
                        const chunkString = JSON.stringify(chunkData);
                        res.write(`data: ${chunkString}\n\n`);
                        
                        // Update processing state
                        processingState.lastProcessedIndex = i + CHUNK_SIZE;
                        processingState.totalRecordsSent += chunk.length;

                        // Add small delay between chunks to prevent overwhelming the client
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (stringifyError) {
                        console.error('Error sending chunk:', stringifyError);
                        res.write(`data: {"type":"error","message":"Error processing chunk ${chunkNum}"}\n\n`);
                    }

                    // Clear chunk data
                    chunk.length = 0;
                }

                // Check if we've processed everything
                if (processingState.totalRecordsSent >= totalRecords) {
                    res.write(`data: {"type":"complete","message":"Processing complete","totalRecords":${totalRecords}}\n\n`);
                    await fs.promises.writeFile(STORAGE_FILE, '{}', 'utf8');
                    res.end();
                    return;
                }

                processingState.isProcessing = false;
            } catch (error) {
                console.error('Error in checkResults:', error);
                res.write(`data: {"type":"error","message":"Error processing results: ${error.message}"}\n\n`);
                processingState.isProcessing = false;
            }
        };

        // Check for results more frequently
        const interval = setInterval(async () => {
            await checkResults();
        }, 1000);

        // Handle client disconnect
        req.on('close', () => {
            clearInterval(interval);
            // Don't clear the file immediately on disconnect to allow for reconnection
            setTimeout(async () => {
                try {
                    const results = loadResults();
                    if (results?.data?.dataframe_2?.length === processingState.totalRecordsSent) {
                        await fs.promises.writeFile(STORAGE_FILE, '{}', 'utf8');
                    }
    } catch (error) {
                    console.error('Error cleaning up after disconnect:', error);
                }
            }, 5000);
        });

    } catch (error) {
        console.error('Error in hex-results stream:', error);
        res.status(500).end();
    }
});

// Add endpoint to receive Hex results
app.post('/api/hex-results', async (req, res) => {
    try {
        const results = req.body;
        console.log('Received raw request body:', {
            hasData: !!results.data,
            dataframe2Length: results.data?.dataframe_2?.length,
            dataframe3Keys: results.data?.dataframe_3 ? Object.keys(results.data.dataframe_3) : []
        });

        // Save results to file
        await fs.promises.writeFile(STORAGE_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            data: results.data
        }));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving hex results:', error);
        res.status(500).json({ error: error.message });
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

// Add health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Complete workspace analysis endpoint
app.post('/api/analyze-workspace', async (req, res) => {
    try {
        const { workspaceId } = req.body;
        if (!workspaceId) {
            throw new Error('workspaceId is required');
        }

        // Step 1: Trigger Hex run
        console.log('Step 1: Triggering Hex run...');
        const hexResponse = await triggerHexRun(workspaceId);

        // Step 2: Wait for Hex run to complete
        console.log('Step 2: Waiting for Hex run to complete...');
        const results = await waitForHexResults(hexResponse.runId);

        // Step 3: Calculate metrics using our MetricsCalculator
        console.log('Step 3: Calculating metrics...');
        const metricsCalculator = new MetricsCalculator();
        const metrics = await metricsCalculator.calculateAllMetrics(
            results.data.dataframe_2,
            results.data.dataframe_3,
            results.data.dataframe_5,
            workspaceId
        );

        // Return complete response
        res.json({
            success: true,
            runId: hexResponse.runId,
            metrics: metrics
        });

    } catch (error) {
        console.error('Error in analyze-workspace:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to analyze workspace',
            details: error.response?.data
        });
    }
});

async function waitForHexResults(runId, maxAttempts = 30) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const results = await loadResults();
            
            // Check if we have valid data for all required dataframes
            if (results?.data?.dataframe_2?.length > 0 && 
                results?.data?.dataframe_3 &&
                results?.data?.dataframe_5?.length > 0) {
                console.log('Valid results found:', {
                    dataframe2Length: results.data.dataframe_2.length,
                    hasDataframe3: !!results.data.dataframe_3,
                    dataframe5Length: results.data.dataframe_5.length
                });
                return results;
            }
            
            console.log(`Attempt ${attempts + 1}: Waiting for valid results...`, {
                hasDataframe2: !!results?.data?.dataframe_2?.length,
                hasDataframe3: !!results?.data?.dataframe_3,
                hasDataframe5: !!results?.data?.dataframe_5?.length
            });
            await delay(2000); // Wait 2 seconds between attempts
            attempts++;
            
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
            if (attempts >= maxAttempts - 1) throw error;
            await delay(2000);
        }
    }
    
    throw new Error('Timeout waiting for results with valid data');
}

async function triggerHexRun(workspaceId) {
    // Implementation of triggerHexRun function
    // This function should return a promise that resolves to the hexResponse
    // You can use the callHexAPI function to trigger the run
    // This is a placeholder and should be replaced with the actual implementation
    return callHexAPI(workspaceId, "21c6c24a-60e8-487c-b03a-1f04dda4f918");
}

// Add Notion page creation endpoint
app.post('/api/create-notion-page', async (req, res) => {
    // Set response type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Set a timeout for the request
    req.setTimeout(30000); // 30 second timeout
    
    try {
        console.log('DEBUG - Received request to create Notion page');
        console.log('DEBUG - Request headers:', req.headers);
        console.log('DEBUG - Session data:', req.session);

        const { workspaceId, metrics, snapshots } = req.body;
        console.log('DEBUG - Request body:', {
            hasWorkspaceId: !!workspaceId,
            hasMetrics: !!metrics,
            hasSnapshots: !!snapshots,
            metricsKeys: metrics ? Object.keys(metrics) : []
        });
        
        if (!req.session?.notionToken) {
            console.error('DEBUG - No Notion token found in session');
            return res.status(401).json({ 
                success: false,
                error: 'No Notion authentication token found' 
            });
        }

        console.log('DEBUG - Using Notion token from session');
        const notion = new Client({
            auth: req.session.notionToken,
            timeoutMs: 25000 // 25 second timeout for Notion API calls
        });

        // Step 1: Verify token by getting user info
        let user;
        try {
            console.log('DEBUG - Step 1: Verifying Notion token...');
            user = await notion.users.me();
            console.log('DEBUG - Notion token verified for user:', user.name);
        } catch (error) {
            console.error('DEBUG - Step 1 Failed: Token verification error:', error);
            console.error('DEBUG - Error details:', {
                name: error.name,
                code: error.code,
                status: error.status,
                message: error.message
            });
            return res.status(401).json({ 
                success: false,
                error: 'Invalid Notion token',
                details: error.message
            });
        }

        // Create page content
        let pageContent = [];
        try {
            console.log('DEBUG - Preparing page content...');
            // Add title and workspace ID
            pageContent.push({
                object: 'block',
                type: 'heading_1',
                heading_1: {
                    rich_text: [{
                        type: 'text',
                        text: { content: 'Workspace Analysis Report' }
                    }]
                }
            });

            pageContent.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{
                        type: 'text',
                        text: { content: `Workspace ID: ${workspaceId}` }
                    }]
                }
            });

            // Add metrics sections
            if (metrics) {
                console.log('DEBUG - Adding metrics sections...');
                try {
                    // Structure & Evolution Metrics
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Structure & Evolution Metrics' }
                            }]
                        }
                    });

                    const structureMetrics = [
                        `Total Pages: ${metrics.totalPages}`,
                        `Active Pages: ${metrics.activePages}`,
                        `Max Depth: ${metrics.maxDepth}`,
                        `Average Depth: ${metrics.avgDepth?.toFixed(2) || 0}`,
                        `Deep Pages: ${metrics.deepPagesCount}`,
                        `Total Connections: ${metrics.totalConnections}`,
                        `Collections: ${metrics.collectionsCount}`
                    ];

                    pageContent.push({
                        object: 'block',
                        type: 'bulleted_list_item',
                        bulleted_list_item: {
                            rich_text: [{
                                type: 'text',
                                text: { content: structureMetrics.join('\n') }
                            }]
                        }
                    });

                    // Usage & Team Metrics
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Usage & Team Metrics' }
                            }]
                        }
                    });

                    const usageMetrics = [
                        `Total Members: ${metrics.totalMembers}`,
                        `Total Guests: ${metrics.totalGuests}`,
                        `Total Teamspaces: ${metrics.totalTeamspaces}`,
                        `Average Members per Teamspace: ${metrics.averageTeamspaceMembers?.toFixed(2) || 0}`
                    ];

                    pageContent.push({
                        object: 'block',
                        type: 'bulleted_list_item',
                        bulleted_list_item: {
                            rich_text: [{
                                type: 'text',
                                text: { content: usageMetrics.join('\n') }
                            }]
                        }
                    });

                    // Growth & Projections
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Growth & Projections' }
                            }]
                        }
                    });

                    const growthMetrics = [
                        `Monthly Member Growth Rate: ${metrics.monthlyMemberGrowthRate?.toFixed(2) || 0}%`,
                        `Monthly Content Growth Rate: ${metrics.monthlyContentGrowthRate?.toFixed(2) || 0}%`,
                        `Growth Capacity: ${metrics.growthCapacity?.toFixed(2) || 0}%`,
                        `Expected Members Next Year: ${Math.round(metrics.expectedMembersNextYear || 0)}`
                    ];

                    pageContent.push({
                        object: 'block',
                        type: 'bulleted_list_item',
                        bulleted_list_item: {
                            rich_text: [{
                                type: 'text',
                                text: { content: growthMetrics.join('\n') }
                            }]
                        }
                    });

                    // Organization Scores
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Organization Scores' }
                            }]
                        }
                    });

                    const organizationMetrics = [
                        `Visibility Score: ${metrics.currentVisibilityScore?.toFixed(2) || 0}%`,
                        `Collaboration Score: ${metrics.currentCollaborationScore?.toFixed(2) || 0}%`,
                        `Productivity Score: ${metrics.currentProductivityScore?.toFixed(2) || 0}%`,
                        `Overall Organization Score: ${metrics.currentOrganizationScore?.toFixed(2) || 0}%`
                    ];

                    pageContent.push({
                        object: 'block',
                        type: 'bulleted_list_item',
                        bulleted_list_item: {
                            rich_text: [{
                                type: 'text',
                                text: { content: organizationMetrics.join('\n') }
                            }]
                        }
                    });

                    // Advanced Metrics
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Advanced Metrics' }
                            }]
                        }
                    });

                    const advancedMetrics = [
                        `Content Maturity Score: ${metrics.contentMaturityScore?.toFixed(2) || 0}`,
                        `Workspace Complexity Score: ${metrics.workspaceComplexityScore?.toFixed(2) || 0}`,
                        `Knowledge Structure Score: ${metrics.knowledgeStructureScore?.toFixed(2) || 0}`,
                        `Team Adoption Score: ${metrics.teamAdoptionScore?.toFixed(2) || 0}`,
                        `Knowledge Sharing Index: ${metrics.knowledgeSharingIndex?.toFixed(2) || 0}`,
                        `Content Freshness Score: ${metrics.contentFreshnessScore?.toFixed(2) || 0}`,
                        `Structure Quality Index: ${metrics.structureQualityIndex?.toFixed(2) || 0}`,
                        `Documentation Coverage: ${metrics.documentationCoverage?.toFixed(2) || 0}%`,
                        `Automation Effectiveness: ${metrics.automationEffectiveness?.toFixed(2) || 0}%`,
                        `Integration Impact Score: ${metrics.integrationImpactScore?.toFixed(2) || 0}`,
                        `Feature Utilization Index: ${metrics.featureUtilizationIndex?.toFixed(2) || 0}`,
                        `Growth Trajectory: ${metrics.growthTrajectory?.toFixed(2) || 0}`,
                        `Scaling Readiness Score: ${metrics.scalingReadinessScore?.toFixed(2) || 0}`,
                        `Growth Potential Score: ${metrics.growthPotentialScore?.toFixed(2) || 0}`
                    ];

                    pageContent.push({
                        object: 'block',
                        type: 'bulleted_list_item',
                        bulleted_list_item: {
                            rich_text: [{
                                type: 'text',
                                text: { content: advancedMetrics.join('\n') }
                            }]
                        }
                    });
                } catch (error) {
                    console.error('DEBUG - Error formatting metrics:', error);
                    // Continue with partial metrics rather than failing completely
                }
            }

            // Add visualizations if available
            if (snapshots) {
                console.log('DEBUG - Adding visualization sections...');
                try {
                    pageContent.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{
                                type: 'text',
                                text: { content: 'Workspace Evolution Visualizations' }
                            }]
                        }
                    });

                    // Helper function to add visualization section
                    const addVisualizationSection = async (title, snapshot) => {
                        if (!snapshot) return; // Skip if snapshot is missing
                        
                        try {
                            // ... visualization section code ...
                        } catch (error) {
                            console.error(`DEBUG - Error adding visualization for ${title}:`, error);
                            // Continue without this visualization
                        }
                    };

                    // Add each visualization section with individual error handling
                    await Promise.all([
                        addVisualizationSection('Past State (60 days ago)', snapshots.past),
                        addVisualizationSection('Current State', snapshots.present),
                        addVisualizationSection('Projected Future (90 days)', snapshots.future),
                        addVisualizationSection('Key Metrics', snapshots.keyMetrics)
                    ]);
                } catch (error) {
                    console.error('DEBUG - Error adding visualizations:', error);
                    // Continue without visualizations rather than failing completely
                }
            }
        } catch (error) {
            console.error('DEBUG - Error preparing page content:', error);
            // Continue with empty content rather than failing
            pageContent = [];
        }

        // Step 2: Find root page
        let rootPage;
        try {
            console.log('DEBUG - Step 2: Searching for root page...');
            const search = await notion.search({
                filter: {
                    property: 'object',
                    value: 'page'
                }
            });
            
            rootPage = search.results[0]?.id;
            if (!rootPage) {
                console.error('DEBUG - Step 2 Failed: No root page found');
                return res.status(500).json({
                    success: false,
                    error: 'Could not find a root page to create the report in'
                });
            }
            
            console.log('DEBUG - Found root page:', rootPage);
        } catch (error) {
            console.error('DEBUG - Step 2 Failed: Error searching for root page:', error);
            console.error('DEBUG - Search error details:', {
                name: error.name,
                code: error.code,
                status: error.status,
                message: error.message
            });
            return res.status(500).json({
                success: false,
                error: 'Failed to search for root page',
                details: error.message
            });
        }

        // Step 3: Create the page
        let page;
        try {
            console.log('DEBUG - Step 3: Creating new page...');
            page = await notion.pages.create({
                parent: { 
                    type: 'page_id', 
                    page_id: rootPage 
                },
                properties: {
                    title: {
                        type: 'title',
                        title: [
                            {
                                type: 'text',
                                text: {
                                    content: 'Workspace Analysis Report'
                                }
                            }
                        ]
                    }
                }
            });
            console.log('DEBUG - Created page:', page.id);
        } catch (error) {
            console.error('DEBUG - Step 3 Failed: Error creating page:', error);
            console.error('DEBUG - Page creation error details:', {
                name: error.name,
                code: error.code,
                status: error.status,
                message: error.message
            });
            return res.status(500).json({
                success: false,
                error: 'Failed to create page',
                details: error.message
            });
        }

        // Step 4: Add content blocks
        try {
            console.log('DEBUG - Step 4: Adding content blocks...');
            await notion.blocks.children.append({
                block_id: page.id,
                children: pageContent
            });
            console.log('DEBUG - Successfully added content to page');
        } catch (error) {
            console.error('DEBUG - Step 4 Failed: Error adding content blocks:', error);
            console.error('DEBUG - Content addition error details:', {
                name: error.name,
                code: error.code,
                status: error.status,
                message: error.message
            });
            // Don't return here - we've created the page, so return success with a warning
            return res.json({ 
                success: true, 
                pageId: page.id,
                warning: 'Page created but content could not be added: ' + error.message
            });
        }

        // Return success response
        return res.json({ success: true, pageId: page.id });

    } catch (error) {
        console.error('DEBUG - Unexpected error in create-notion-page endpoint:', error);
        console.error('DEBUG - Error stack:', error.stack);
        // Ensure we haven't already sent a response
        if (!res.headersSent) {
            return res.status(500).json({ 
                success: false,
                error: 'Failed to create Notion page',
                details: error.message
            });
        }
    }
});

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));