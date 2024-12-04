import express from 'express';
import path from 'path';
import { fetchWorkspaceData } from './fetchData.js';
import { parseDataToGraph } from './parseData.js';
import { calculateWorkspaceScore } from './utils.js';

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
    const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/';
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}`;
    res.redirect(authUrl);
});

// Callback Endpoint for OAuth
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const workspaceData = await fetchWorkspaceData(code);
        const graphData = parseDataToGraph(workspaceData);
        const workspaceScore = calculateWorkspaceScore(graphData);

        graphCache = { score: workspaceScore, graph: graphData }; // Save data to cache
        res.redirect('/'); // Redirect to home page after processing
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing Notion data.');
    }
});

// Provide a JSON endpoint for the graph
app.get('/api/data', (req, res) => {
    if (graphCache) {
        res.json(graphCache); // Serve cached graph data
    } else {
        res.status(404).json({ error: 'No graph data available. Authenticate first.' });
    }
});

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));