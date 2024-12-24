import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fetchWorkspaceData } from './fetchData.js';
import { parseDataToGraph } from './parseData.js';
import { calculateWorkspaceScore } from './utils.js';
import { Client } from '@notionhq/client';
import session from 'express-session';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

// Verify environment variables are loaded
console.log('Environment check:', {
    hasNotionId: !!process.env.NOTION_CLIENT_ID,
    hasNotionSecret: !!process.env.NOTION_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

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
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Notion OAuth Redirect
app.get('/auth', (req, res) => {
    const CLIENT_ID = process.env.NOTION_CLIENT_ID;
    const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
    
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

    if (!code) {
        console.error('No code received from Notion');
        return res.redirect('/redirect?error=No authorization code received');
    }

    try {
        console.log('Received auth code:', code);
        
        // Get access token from Notion OAuth
        const tokenResponse = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }, {
            auth: {
                username: process.env.NOTION_CLIENT_ID,
                password: process.env.NOTION_CLIENT_SECRET
            }
        });

        // Store the access token in session
        req.session.notionToken = tokenResponse.data.access_token;
        
        res.redirect('/redirect');
    } catch (error) {
        console.error('Callback error:', error);
        res.redirect(`/redirect?error=${encodeURIComponent(error.message)}`);
    }
});

// Redirect Page
app.get('/redirect', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'redirect.html'));
});

// API endpoint with better error handling
app.get('/api/data', async (req, res) => {
    try {
        const notion = new Client({
            auth: req.session.notionToken
        });

        const graph = await fetchWorkspaceData(notion);
        
        // Calculate workspace score based on complete graph
        const score = calculateWorkspaceScore(graph);

        res.json({
            graph,
            score
        });
    } catch (error) {
        console.error('Error fetching data:', error);
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

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));