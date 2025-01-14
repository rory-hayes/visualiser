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

let graphCache = null; // Cache to store graph data temporarily

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
app.use(express.json()); // Add this line to parse JSON bodies

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

// Add this new route to your existing routes
app.post('/api/generate-report', async (req, res) => {
    try {
        console.log('Received generate-report request:', {
            body: req.body,
            contentType: req.headers['content-type']
        });

        const { workspaceId } = req.body;
        
        if (!workspaceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Workspace ID is required' 
            });
        }

        // Initialize AI service if not already done
        const aiService = new AIInsightsService();
        
        // Generate report and wait for completion
        const result = await aiService.generateReport(workspaceId);
        
        res.json({
            success: true,
            runId: result.runId,
            status: result.status,
            data: result.data
        });
    } catch (error) {
        console.error('Error in generate-report endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));