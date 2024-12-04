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
const PORT = process.env.PORT || 3006;

let accessToken = ''; // Placeholder for storing the OAuth token

// Serve the landing page
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Notion Visualizer</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>Welcome to Notion Visualizer</h1>
                <p>Understand your workspace like never before.</p>
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

        const data = await fetchWorkspaceData();

        if (data && data.length > 0) {
            const graphData = parseDataToGraph(data);
            const svg = generateInteractiveGraph(graphData);

            res.send(`
                <html>
                    <head>
                        <title>Notion Workspace Visualization</title>
                        <script src="https://d3js.org/d3.v7.min.js"></script>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                            #graph { margin: auto; width: 80%; height: 600px; overflow: auto; }
                            .node { font: 10px sans-serif; }
                            .link { fill: none; stroke: #ccc; stroke-width: 2px; }
                        </style>
                    </head>
                    <body>
                        <h1>Your Notion Workspace Visualization</h1>
                        <div id="graph"></div>
                        <script>
                            ${svg}
                        </script>
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
            {},
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
    const now = new Date();

    data.forEach((item) => {
        const lastEditedTime = new Date(item.last_edited_time);
        const ageInDays = Math.floor((now - lastEditedTime) / (1000 * 60 * 60 * 24));
        nodes.push({
            id: item.id,
            name: item.properties?.title?.[0]?.text?.content || `Unnamed ${item.object}`,
            type: item.object,
            ageInDays,
        });
    });

    data.forEach((item) => {
        if (item.parent && item.parent.database_id) {
            links.push({ source: item.parent.database_id, target: item.id });
        }
    });

    return { nodes, links };
}

// Generate Interactive D3 Graph
function generateInteractiveGraph(graphData) {
    return `
        const width = 960, height = 600;

        const svg = d3.select("#graph")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(${JSON.stringify(graphData.links)})
            .enter()
            .append("line")
            .attr("stroke-width", 1.5);

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(${JSON.stringify(graphData.nodes)})
            .enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", (d) => d.ageInDays > 365 ? "red" : "green")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        const simulation = d3.forceSimulation(${JSON.stringify(graphData.nodes)})
            .force("link", d3.forceLink(${JSON.stringify(graphData.links)}).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        simulation
            .nodes(${JSON.stringify(graphData.nodes)})
            .on("tick", () => {
                link.attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node.attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        simulation.force("link").links(${JSON.stringify(graphData.links)});
    `;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});