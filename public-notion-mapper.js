import axios from 'axios';
import { D3Node } from 'd3-node';
import express from 'express';

// OAuth Configuration
const CLIENT_ID = '150d872b-594c-804e-92e4-0037ffa80cff';
const CLIENT_SECRET = 'secret_swa9JCDo4wE0FqJMxRxj4xcPpf00EZniVtKG2LIwc3r';
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

// Notion API Configuration
const NOTION_API_VERSION = '2022-06-28';

// Express App Setup
const app = express();
const PORT = 3006;

let accessToken = ''; // Placeholder for storing the OAuth token

// Serve the landing page with a "Get Started" button
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Notion Visualizer</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>Welcome to Notion Visualizer</h1>
                <p>Click the button below to get started.</p>
                <button style="padding: 10px 20px; font-size: 16px; cursor: pointer;" onclick="window.location.href='/auth'">Get Started</button>
            </body>
        </html>
    `);
});

// Redirect to Notion OAuth URL
app.get('/auth', (req, res) => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Handle OAuth Callback and Generate Visualization
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange authorization code for an access token
        const tokenResponse = await axios.post(
            TOKEN_URL,
            {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                },
            }
        );

        accessToken = tokenResponse.data.access_token;
        console.log('Access Token:', accessToken);

        // Fetch workspace data
        console.log('Fetching Notion workspace data...');
        const data = await fetchWorkspaceData();

        if (data && data.length > 0) {
            // Parse and generate SVG visualization
            console.log('Parsing data into graph structure...');
            const graphData = parseDataToGraph(data);

            console.log('Generating graph...');
            const svg = generateGraph(graphData);

            // Render the SVG on the page
            res.send(`
                <html>
                    <head><title>Notion Workspace Visualization</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                        <h1>Your Notion Workspace Visualization</h1>
                        <div style="margin: auto; width: 80%; overflow: auto;">${svg}</div>
                    </body>
                </html>
            `);
        } else {
            res.send('<h1>No data fetched. Ensure pages and teamspaces are shared with the integration.</h1>');
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('<h1>Failed to authenticate with Notion or generate visualization.</h1>');
    }
});

// Fetch workspace data
async function fetchWorkspaceData() {
    try {
        const response = await axios.post(
            'https://api.notion.com/v1/search',
            {}, // Empty body retrieves all accessible pages/databases
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_API_VERSION,
                },
            }
        );
        return response.data.results;
    } catch (error) {
        console.error('Error fetching workspace data:', error.message);
        return [];
    }
}

// Parse Notion data into graph format
function parseDataToGraph(data) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    const now = new Date();

    data.forEach((item) => {
        const lastEditedTime = new Date(item.last_edited_time);
        const ageInDays = Math.floor((now - lastEditedTime) / (1000 * 60 * 60 * 24));

        nodes.push({
            id: item.id,
            name: item.properties?.title?.[0]?.text?.content || `Unnamed ${item.object}`,
            type: item.object,
            childCount: 0,
            lastEditedTime,
            ageInDays,
        });
        nodeIds.add(item.id);
    });

    data.forEach((item) => {
        if (item.parent && item.parent.database_id) {
            const parentId = item.parent.database_id;

            links.push({ source: parentId, target: item.id });

            const parentNode = nodes.find((node) => node.id === parentId);
            if (parentNode) parentNode.childCount += 1;

            if (!nodeIds.has(parentId)) {
                nodes.push({
                    id: parentId,
                    name: `Database ${parentId}`,
                    type: 'database',
                    childCount: 1,
                });
                nodeIds.add(parentId);
            }
        }
    });

    const rootNodes = nodes.filter((node) => !links.some((link) => link.target === node.id));
    if (rootNodes.length > 1) {
        const syntheticRootId = 'synthetic-root';
        nodes.push({
            id: syntheticRootId,
            name: 'Workspace Root',
            type: 'root',
            childCount: rootNodes.length,
        });

        rootNodes.forEach((rootNode) => {
            links.push({
                source: syntheticRootId,
                target: rootNode.id,
            });
        });
    }

    return { nodes, links };
}

// Generate graph SVG
function generateGraph(data) {
    const d3n = new D3Node();
    const d3 = d3n.d3;

    const width = 1200;
    const height = 1000;

    const svg = d3n.createSVG(width, height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background-color', '#ffffff');

    const hierarchyData = d3
        .stratify()
        .id((d) => d.id)
        .parentId((d) => {
            const link = data.links.find((l) => l.target === d.id);
            return link ? link.source : null;
        })(data.nodes);

    const treeLayout = d3.tree().size([height - 200, width - 200]);
    const root = treeLayout(hierarchyData);

    svg.append('g')
        .selectAll('path')
        .data(root.links())
        .enter()
        .append('path')
        .attr('d', d3.linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x))
        .attr('stroke', '#ccc');

    svg.append('g')
        .selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .append('text')
        .text((d) => d.data.name);

    return d3n.svgString();
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});