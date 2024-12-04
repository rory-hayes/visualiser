import axios from 'axios';
import express from 'express';
import path from 'path';
import fs from 'fs';

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect to Notion OAuth URL
app.get('/auth', (req, res) => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Handle OAuth Callback and Serve Visualization
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

        // Fetch workspace data
        const data = await fetchWorkspaceData();

        if (data && data.length > 0) {
            // Parse graph data and render the visualization page
            const graphData = parseDataToGraph(data);
            res.send(`
                <html>
                    <head>
                        <title>Notion Workspace Visualization</title>
                        <script src="https://d3js.org/d3.v7.min.js"></script>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                            }
                            #graph {
                                width: 100vw;
                                height: 100vh;
                            }
                        </style>
                    </head>
                    <body>
                        <h1 style="text-align: center;">Notion Workspace Visualization</h1>
                        <div id="graph"></div>
                        <script>
                            const data = ${JSON.stringify(graphData)};
                            const width = window.innerWidth;
                            const height = window.innerHeight;

                            const svg = d3.select("#graph")
                                .append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .call(d3.zoom().on("zoom", function (event) {
                                    svg.attr("transform", event.transform);
                                }))
                                .append("g");

                            const tree = d3.tree().size([height, width - 200]);
                            const root = d3.hierarchy(data, d => d.children);

                            tree(root);

                            const link = svg.selectAll(".link")
                                .data(root.links())
                                .enter()
                                .append("path")
                                .attr("class", "link")
                                .attr("fill", "none")
                                .attr("stroke", "#ccc")
                                .attr("stroke-width", 2)
                                .attr("d", d3.linkHorizontal()
                                    .x(d => d.y)
                                    .y(d => d.x));

                            const node = svg.selectAll(".node")
                                .data(root.descendants())
                                .enter()
                                .append("g")
                                .attr("class", "node")
                                .attr("transform", d => \`translate(\${d.y},\${d.x})\`);

                            node.append("circle")
                                .attr("r", 10)
                                .attr("fill", d => d.data.type === "database" ? "#6c63ff" : "#ff6f61")
                                .on("mouseover", function (event, d) {
                                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
                                    tooltip.transition().duration(200).style("opacity", .9);
                                    tooltip.html(\`<strong>\${d.data.name}</strong><br>Type: \${d.data.type}<br>Last Edited: \${d.data.lastEditedTime}\`)
                                        .style("left", (event.pageX + 5) + "px")
                                        .style("top", (event.pageY - 28) + "px");
                                })
                                .on("mouseout", function (d) {
                                    d3.select(this).attr("stroke", "none");
                                    tooltip.transition().duration(500).style("opacity", 0);
                                });

                            node.append("text")
                                .attr("dy", ".35em")
                                .attr("x", d => d.children ? -15 : 15)
                                .style("text-anchor", d => d.children ? "end" : "start")
                                .text(d => d.data.name);

                            const tooltip = d3.select("body").append("div")
                                .attr("class", "tooltip")
                                .style("opacity", 0)
                                .style("position", "absolute")
                                .style("background", "#fff")
                                .style("border", "1px solid #ccc")
                                .style("padding", "10px")
                                .style("pointer-events", "none");
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
    const nodes = data.map(item => ({
        name: item.properties?.title?.[0]?.text?.content || `Unnamed ${item.object}`,
        type: item.object,
        lastEditedTime: item.last_edited_time,
    }));
    return { name: "Workspace Root", children: nodes };
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});