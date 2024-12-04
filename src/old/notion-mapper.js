import axios from 'axios';
import fs from 'fs';
import { D3Node } from 'd3-node';

// Configuration
const NOTION_API_KEY = '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';
const NOTION_API_VERSION = '2022-06-28';

// Fetch workspace data
async function fetchWorkspaceData() {
    try {
        const response = await axios.post(
            'https://api.notion.com/v1/search',
            {}, // Empty body for all pages/databases
            {
                headers: {
                    Authorization: `Bearer ${NOTION_API_KEY}`,
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

// Parse Notion data into graph format
function parseDataToGraph(data) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set(); // Track existing node IDs to avoid duplicates

    const now = new Date(); // Current time for calculating age

    // Add all pages and databases as nodes
    data.forEach((item) => {
        const lastEditedTime = new Date(item.last_edited_time);
        const ageInDays = Math.floor((now - lastEditedTime) / (1000 * 60 * 60 * 24)); // Age in days

        nodes.push({
            id: item.id,
            name: item.properties?.title?.[0]?.text?.content || `Unnamed ${item.object}`,
            type: item.object, // 'page' or 'database'
            childCount: 0, // Initialize child count
            lastEditedTime, // Add last edited time
            ageInDays, // Add age in days
        });
        nodeIds.add(item.id); // Track node ID
    });

    // Add links for parent relationships and ensure missing parents are added
    data.forEach((item) => {
        if (item.parent && item.parent.database_id) {
            const parentId = item.parent.database_id;

            // Add a link
            links.push({
                source: parentId,
                target: item.id,
            });

            // Increment child count for the parent node
            const parentNode = nodes.find((node) => node.id === parentId);
            if (parentNode) parentNode.childCount += 1;

            // Add parent node if it doesn't already exist
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

    // Identify nodes with no parent
    const rootNodes = nodes.filter(
        (node) => !links.some((link) => link.target === node.id)
    );

    // Add a synthetic root node if there are multiple roots
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

    console.log('Graph Nodes:', JSON.stringify(nodes, null, 2)); // Debug log
    console.log('Graph Links:', JSON.stringify(links, null, 2)); // Debug log

    return { nodes, links };
}

// Calculate workspace quality score
function calculateWorkspaceScore(nodes, links) {
    let score = 100; // Start with a perfect score

    nodes.forEach((node) => {
        if (node.ageInDays > 365) score -= 5; // Penalize old nodes
        if (node.childCount === 0) score -= 10; // Penalize unconnected nodes
        if (node.ageInDays <= 30) score += 5; // Reward recent edits
    });

    links.forEach(() => {
        score += 10; // Reward relationships
    });

    // Ensure the score is between 0 and 100
    return Math.max(0, Math.min(100, score));
}

// Generate graph
function generateGraph(data) {
    const d3n = new D3Node();
    const d3 = d3n.d3;

    const width = 1200;
    const height = 1000;

    // Heatmap color scale based on age
    const colorScale = d3.scaleLinear()
        .domain([0, 30, 365]) // 0 days, 30 days (1 month), 365 days (1 year)
        .range(['#28a745', '#ffc107', '#dc3545']); // Green, Yellow, Red

    // Create a hierarchy layout
    const hierarchyData = d3
        .stratify()
        .id((d) => d.id)
        .parentId((d) => {
            const link = data.links.find((l) => l.target === d.id);
            return link ? link.source : null;
        })(data.nodes);

    const treeLayout = d3.tree().size([height - 200, width - 200]);
    const root = treeLayout(hierarchyData);

    // Calculate quality score
    const score = calculateWorkspaceScore(data.nodes, data.links);

    // Create SVG canvas
    const svg = d3n.createSVG(width, height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background-color', '#ffffff');

    // Add total counts and score at the top
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text(`Workspace Overview: ${data.nodes.length} Nodes, ${data.links.length} Relationships`)
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#000');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text(`Workspace Quality Score: ${score}%`)
        .attr('font-size', '14px')
        .attr('fill', score > 70 ? '#28a745' : score > 40 ? '#ffc107' : '#dc3545');

    // Add links
    svg.append('g')
        .selectAll('path')
        .data(root.links())
        .enter()
        .append('path')
        .attr('d', d3.linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x))
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1.5);

    // Add nodes
    const node = svg
        .append('g')
        .selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${d.y},${d.x})`);

    node.append('rect')
        .attr('width', (d) => (d.data.type === 'database' ? 80 : 60))
        .attr('height', 30)
        .attr('x', (d) => (d.data.type === 'database' ? -40 : -30))
        .attr('y', -15)
        .attr('fill', (d) => colorScale(d.data.ageInDays)) // Apply heatmap color
        .attr('stroke', '#000')
        .attr('stroke-width', 1);

    // Add text labels
    node.append('text')
        .attr('dy', 5)
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .text((d) => d.data.name || `Unnamed ${d.data.type}`)
        .attr('font-size', '10px')
        .attr('fill', '#000');

    // Add child count
    node.append('text')
        .attr('dy', 20)
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .text((d) => `Children: ${d.data.childCount || 0}`)
        .attr('font-size', '8px')
        .attr('fill', '#555');

    // Add outdated nodes section
    const outdatedNodes = data.nodes.filter((node) => node.ageInDays > 365);
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 100)
        .attr('text-anchor', 'middle')
        .text(`Outdated Nodes: ${outdatedNodes.length}`)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#dc3545');

    return d3n.svgString();
}

// Main function
(async function main() {
    console.log('Fetching Notion workspace data...');
    const data = await fetchWorkspaceData();

    if (!data || data.length === 0) {
        console.error('No data fetched. Ensure the API key is correct and the integration has access.');
        return;
    }

    console.log('Parsing data into graph structure...');
    const graphData = parseDataToGraph(data);

    console.log('Generating graph...');
    const svg = generateGraph(graphData);

    console.log('Saving graph to output.svg...');
    fs.writeFileSync('output.svg', svg);
    console.log('Graph saved successfully! Open output.svg to view.');
})();