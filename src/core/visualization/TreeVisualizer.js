import { graphviz } from 'd3-graphviz';
import { BaseVisualizer } from './BaseVisualizer.js';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export class TreeVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.maxDepth = 4; // Limit visualization to 4 levels
        this.width = 1200;
        this.height = 800;
        
        // Get directory name in ES module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.visualizationsDir = path.join(__dirname, '..', '..', 'public', 'visualizations');
    }

    processHierarchy(data) {
        // Create a single root node for the workspace
        const rootNode = {
            id: data.SPACE_ID,
            title: 'Workspace Root',
            type: 'workspace',
            depth: 0,
            children: []
        };

        // Add collections as first level children
        if (data.COLLECTION_COUNT > 0) {
            for (let i = 0; i < data.COLLECTION_COUNT; i++) {
                rootNode.children.push({
                    id: `collection_${i}`,
                    title: `Collection ${i + 1}`,
                    type: 'collection',
                    depth: 1,
                    children: []
                });
            }
        }

        // Add collection views and pages as second level
        const remainingPages = data.PAGE_COUNT - data.COLLECTION_VIEW_PAGE_COUNT;
        
        // Add collection view pages
        if (data.COLLECTION_VIEW_PAGE_COUNT > 0) {
            rootNode.children.push({
                id: 'collection_view_pages',
                title: `Collection View Pages (${data.COLLECTION_VIEW_PAGE_COUNT})`,
                type: 'collection_view_page',
                depth: 1,
                children: []
            });
        }

        // Add regular pages
        if (remainingPages > 0) {
            rootNode.children.push({
                id: 'pages',
                title: `Pages (${remainingPages})`,
                type: 'page',
                depth: 1,
                children: []
            });
        }

        return [rootNode];
    }

    aggregateDeepBranches(node, currentDepth = 0) {
        if (!node) return null;

        if (currentDepth >= this.maxDepth && node.children.length > 0) {
            // Create summary node
            return {
                id: node.id,
                title: `${node.title} (+${this.countDescendants(node)} more)`,
                type: node.type,
                depth: currentDepth,
                isAggregated: true
            };
        }

        const processedChildren = node.children
            .map(child => this.aggregateDeepBranches(child, currentDepth + 1))
            .filter(Boolean);

        return {
            ...node,
            children: processedChildren
        };
    }

    countDescendants(node) {
        if (!node.children) return 0;
        return node.children.length + 
            node.children.reduce((sum, child) => sum + this.countDescendants(child), 0);
    }

    generateDotString(hierarchy) {
        let dot = 'digraph G {\n';
        dot += '  graph [rankdir=TB, splines=ortho];\n';
        dot += '  node [shape=box, style=rounded, fontname="Arial"];\n';

        const processNode = (node, parentId = null) => {
            // Node definition
            const color = this.getNodeColor(node.type);
            const label = node.title.length > 30 ? 
                node.title.substring(0, 27) + '...' : 
                node.title;
            
            dot += `  "${node.id}" [label="${label}", fillcolor="${color}", style="filled,rounded"];\n`;

            // Edge definition if there's a parent
            if (parentId) {
                dot += `  "${parentId}" -> "${node.id}";\n`;
            }

            // Process children if not aggregated
            if (!node.isAggregated && node.children) {
                node.children.forEach(child => processNode(child, node.id));
            }
        };

        hierarchy.forEach(root => processNode(root));
        dot += '}';
        return dot;
    }

    async generateVisualization(data) {
        try {
            // Process data into hierarchy
            const hierarchy = this.processHierarchy(data);
            
            // Aggregate deep branches
            const processedHierarchy = hierarchy.map(root => 
                this.aggregateDeepBranches(root));

            // Generate DOT string
            const dotString = this.generateDotString(processedHierarchy);

            // Create a minimal HTML page with the visualization
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <script src="https://d3js.org/d3.v7.min.js"></script>
                    <script src="https://unpkg.com/@hpcc-js/wasm@1.14.1/dist/index.min.js"></script>
                    <script src="https://unpkg.com/d3-graphviz@4.1.0/build/d3-graphviz.min.js"></script>
                    <style>
                        #graph { width: ${this.width}px; height: ${this.height}px; }
                    </style>
                </head>
                <body>
                    <div id="graph"></div>
                    <script>
                        // Initialize graphviz
                        const graph = d3.select("#graph")
                            .graphviz()
                            .width(${this.width})
                            .height(${this.height})
                            .fit(true)
                            .zoom(false);

                        // Render the graph
                        graph.renderDot(\`${dotString}\`);
                    </script>
                </body>
                </html>
            `;

            // Launch Puppeteer
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Set viewport
            await page.setViewport({
                width: this.width,
                height: this.height,
                deviceScaleFactor: 2
            });

            // Load the HTML
            await page.setContent(html);

            // Wait for the graph to be rendered
            await page.waitForFunction(() => {
                const svg = document.querySelector('svg');
                return svg && svg.querySelector('g');
            });

            // Create visualizations directory if it doesn't exist
            if (!fs.existsSync(this.visualizationsDir)) {
                fs.mkdirSync(this.visualizationsDir, { recursive: true });
            }

            // Generate unique filename
            const filename = `tree-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
            const filepath = path.join(this.visualizationsDir, filename);

            // Take a screenshot and save directly to file
            await page.screenshot({
                path: filepath,
                type: 'png'
            });

            // Close browser
            await browser.close();

            // Generate URL for the saved image
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const imageUrl = `${baseUrl}/visualizations/${filename}`;

            return {
                dotString,
                imageUrl,
                visualizationPath: filepath
            };
        } catch (error) {
            console.error('Error generating visualization:', error);
            throw error;
        }
    }

    addInteractivity(container) {
        // Add zoom behavior
        const svg = container.querySelector('svg');
        if (!svg) return;

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                const g = svg.querySelector('g');
                if (g) {
                    g.setAttribute('transform', event.transform);
                }
            });

        d3.select(svg).call(zoom);

        // Add node hover effects
        const nodes = svg.querySelectorAll('.node');
        nodes.forEach(node => {
            node.addEventListener('mouseover', () => {
                node.style.filter = 'url(#glow)';
                this.highlightConnectedNodes(node, true);
            });

            node.addEventListener('mouseout', () => {
                node.style.filter = 'none';
                this.highlightConnectedNodes(node, false);
            });
        });
    }

    highlightConnectedNodes(node, highlight) {
        const svg = node.closest('svg');
        if (!svg) return;

        const nodeId = node.id;
        const edges = svg.querySelectorAll('.edge');
        const connectedNodes = new Set();

        // Find connected nodes through edges
        edges.forEach(edge => {
            const [sourceId, targetId] = edge.id.split('-');
            if (sourceId === nodeId) {
                connectedNodes.add(targetId);
                if (highlight) {
                    edge.style.stroke = '#000';
                    edge.style.strokeWidth = '2px';
                } else {
                    edge.style.stroke = '';
                    edge.style.strokeWidth = '';
                }
            } else if (targetId === nodeId) {
                connectedNodes.add(sourceId);
                if (highlight) {
                    edge.style.stroke = '#000';
                    edge.style.strokeWidth = '2px';
                } else {
                    edge.style.stroke = '';
                    edge.style.strokeWidth = '';
                }
            }
        });

        // Update connected nodes
        svg.querySelectorAll('.node').forEach(n => {
            if (n !== node && !connectedNodes.has(n.id)) {
                n.style.opacity = highlight ? '0.3' : '1';
            }
        });
    }
} 