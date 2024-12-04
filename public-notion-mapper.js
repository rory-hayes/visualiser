import axios from 'axios';
import fs from 'fs';
import { D3Node } from 'd3-node';
import express from 'express';

// OAuth Configuration
const CLIENT_ID = '150d872b-594c-804e-92e4-0037ffa80cff';
const CLIENT_SECRET = 'secret_swa9JCDo4wE0FqJMxRxj4xcPpf00EZniVtKG2LIwc3r';
const REDIRECT_URI = 'http://localhost:3006/callback';
const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

// Notion API Configuration
const NOTION_API_VERSION = '2022-06-28';

// Express App Setup
const app = express();
const PORT = 3006;

let accessToken = ''; // Placeholder for storing the OAuth token

// Step 1: Redirect to Notion OAuth URL
app.get('/auth', (req, res) => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Step 2: Handle OAuth Callback and Exchange Code for Access Token
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
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

        // Step 3: Fetch Data and Generate Visualization
        console.log('Fetching Notion workspace data...');
        const data = await fetchWorkspaceData();

        if (data && data.length > 0) {
            console.log('Parsing data into graph structure...');
            const graphData = parseDataToGraph(data);

            console.log('Generating graph...');
            const svg = generateGraph(graphData);

            console.log('Saving graph to output.svg...');
            fs.writeFileSync('output.svg', svg);
            console.log('Graph saved successfully!');

            res.send('Graph generated successfully! Open output.svg to view.');
        } else {
            res.send('No data fetched. Ensure pages and teamspaces are shared with the integration.');
        }
    } catch (error) {
        console.error('Error exchanging token or generating visualization:', error.message);
        res.status(500).send('Failed to authenticate with Notion or generate visualization.');
    }
});

// Fetch Workspace Data
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
        console.log('Fetched Data:', JSON.stringify(response.data.results, null, 2)); // Debug log
        return response.data.results;
    } catch (error) {
        console.error('Error fetching workspace data:', error.message);
        return [];
    }
}

// Parse Notion Data into Graph Format
function parseDataToGraph(data) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set(); // Track existing node IDs to avoid duplicates

    const now = new Date();

    data.forEach((item) => {
        const lastEditedTime = new Date(item.last_edited_time);
        const ageInDays = Math.floor((now - lastEditedTime) / (1000 * 60 * 60 * 24)); // Age in days

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

// Generate Graph
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Visit /auth to start the OAuth flow.');
});