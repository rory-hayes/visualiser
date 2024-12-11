import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fetchWorkspaceData } from './fetchData.js';
import { parseDataToGraph } from './parseData.js';
import { calculateWorkspaceScore } from './utils.js';

// Load environment variables from .env file
dotenv.config();

// Verify environment variables are loaded
console.log('Environment check:', {
    hasNotionSecret: !!process.env.NOTION_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

let graphCache = null; // Cache to store graph data temporarily

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(process.cwd(), 'public')));

// Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Notion OAuth Redirect
app.get('/auth', (req, res) => {
    const CLIENT_ID = '150d872b-594c-804e-92e4-0037ffa80cff';
    const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}`;
    res.redirect(authUrl);
});

// Callback Endpoint for OAuth
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        console.error('No code received from Notion');
        return res.redirect('/redirect?error=No authorization code received');
    }

    try {
        console.log('Received auth code:', code);
        console.log('Starting workspace data fetch...');
        
        const workspaceData = await fetchWorkspaceData(code);
        
        console.log('Workspace data fetched successfully');
        
        if (!workspaceData) {
            throw new Error('No workspace data received from Notion');
        }

        const graphData = parseDataToGraph(workspaceData);
        const workspaceScore = calculateWorkspaceScore(graphData);

        graphCache = { 
            score: workspaceScore, 
            graph: graphData,
            timestamp: Date.now()
        };

        res.redirect('/redirect');
    } catch (error) {
        console.error('Callback error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        const errorMessage = error.response?.data?.message || error.message;
        res.redirect(`/redirect?error=${encodeURIComponent(errorMessage)}`);
    }
});

// Redirect Page
app.get('/redirect', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'redirect.html'));
});

// API endpoint with better error handling
app.get('/api/data', (req, res) => {
    try {
        if (!graphCache) {
            return res.status(404).json({ 
                error: 'No graph data available. Please authenticate first.' 
            });
        }

        // Check if cache is too old (optional)
        const cacheAge = Date.now() - graphCache.timestamp;
        if (cacheAge > 3600000) { // 1 hour
            return res.status(404).json({ 
                error: 'Cache expired. Please authenticate again.' 
            });
        }

        res.json(graphCache);
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ 
            error: 'Error retrieving graph data' 
        });
    }
});

// Add this endpoint temporarily for debugging
app.get('/debug-env', (req, res) => {
    res.json({
        hasSecret: !!process.env.NOTION_CLIENT_SECRET,
        secretLength: process.env.NOTION_CLIENT_SECRET?.length || 0
    });
});

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));