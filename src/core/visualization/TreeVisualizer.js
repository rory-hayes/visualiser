import { graphviz } from 'd3-graphviz';
import { BaseVisualizer } from './BaseVisualizer.js';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TreeVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.maxDepth = 4; // Limit visualization to 4 levels
        this.width = 1200;
        this.height = 800;
        
        // Set up visualization directory path
        const projectRoot = path.resolve(__dirname, '..', '..');
        this.visualizationsDir = path.join(projectRoot, 'public', 'visualizations');
        
        // Ensure visualizations directory exists
        if (!fs.existsSync(this.visualizationsDir)) {
            try {
                fs.mkdirSync(this.visualizationsDir, { recursive: true });
                console.log('Created visualizations directory:', this.visualizationsDir);
            } catch (error) {
                console.error('Error creating visualizations directory:', error);
            }
        }
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
        // Configure graph layout
        dot += '  graph [rankdir=TB, splines=ortho, ranksep=0.8, nodesep=0.8];\n';
        dot += '  node [shape=box, style="rounded,filled", fontname="Arial", margin=0.2];\n';
        dot += '  edge [color="#666666"];\n';

        const processNode = (node, parentId = null) => {
            // Node styling based on type
            let color, fontcolor;
            switch (node.type) {
                case 'workspace':
                    color = '#4A90E2';
                    fontcolor = 'white';
                    break;
                case 'collection':
                    color = '#7ED321';
                    fontcolor = 'white';
                    break;
                case 'collection_view_page':
                    color = '#F5A623';
                    fontcolor = 'white';
                    break;
                case 'page':
                    color = '#D0021B';
                    fontcolor = 'white';
                    break;
                default:
                    color = '#E8E8E8';
                    fontcolor = 'black';
            }

            // Create label with HTML-like formatting
            const label = node.title.length > 30 ? 
                node.title.substring(0, 27) + '...' : 
                node.title;
            
            // Add node definition with styling
            dot += `  "${node.id}" [label="${label}", fillcolor="${color}", fontcolor="${fontcolor}"];\n`;

            // Add edge with styling if there's a parent
            if (parentId) {
                dot += `  "${parentId}" -> "${node.id}" [penwidth=1.5];\n`;
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
        let dotString;
        try {
            // Process data into hierarchy
            const hierarchy = this.processHierarchy(data);
            
            // Aggregate deep branches
            const processedHierarchy = hierarchy.map(root => 
                this.aggregateDeepBranches(root));

            // Generate DOT string
            dotString = this.generateDotString(processedHierarchy);
            console.log('Generated DOT string:', dotString.substring(0, 100) + '...');

            // Generate unique filename for SVG
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            const filename = `tree-${timestamp}-${random}.svg`;
            const svgFile = path.join(this.visualizationsDir, filename);

            // Create a virtual DOM environment
            const dom = new JSDOM('<!DOCTYPE html><div id="graph"></div>');
            const document = dom.window.document;

            // Create an SVG element
            const svg = d3.select(document.querySelector('#graph'))
                .append('svg')
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('xmlns', 'http://www.w3.org/2000/svg');

            // Add title and description
            svg.append('title').text('Workspace Structure Visualization');
            svg.append('desc').text(`Workspace visualization showing ${data.COLLECTION_COUNT} collections and ${data.PAGE_COUNT} pages`);

            // Use d3-graphviz to render the graph
            const graphvizInstance = graphviz(svg);
            graphvizInstance
                .width(this.width)
                .height(this.height)
                .fit(true);

            // Wrap the rendering in a promise
            await new Promise((resolve, reject) => {
                try {
                    graphvizInstance
                        .onerror((error) => {
                            console.error('Graphviz error:', error);
                            reject(error);
                        })
                        .render(dotString, () => {
                            try {
                                // Get the rendered SVG content
                                const svgContent = document.querySelector('#graph').innerHTML;
                                if (!svgContent) {
                                    reject(new Error('No SVG content generated'));
                                    return;
                                }
                                
                                // Save the SVG
                                fs.writeFileSync(svgFile, svgContent);
                                console.log('Saved SVG visualization to:', svgFile);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        });
                } catch (error) {
                    reject(error);
                }
            }).catch((error) => {
                console.error('Failed to render with d3-graphviz:', error);
                // Fallback to basic tree visualization
                const basicSvg = this.generateBasicTreeSvg(data, processedHierarchy[0]);
                fs.writeFileSync(svgFile, basicSvg);
                console.log('Saved fallback SVG visualization');
            });

            // Generate URL for the saved image
            console.log('Environment variables:', {
                NODE_ENV: process.env.NODE_ENV,
                BASE_URL: process.env.BASE_URL
            });

            // Determine the base URL with fallbacks
            let baseUrl = 'http://localhost:3000';
            if (process.env.NODE_ENV === 'production') {
                baseUrl = 'https://visualiser-xhjh.onrender.com';
            }
            if (process.env.BASE_URL) {
                baseUrl = process.env.BASE_URL;
            }

            const imageUrl = `${baseUrl}/visualizations/${filename}`;
            
            console.log('URL Generation:', {
                baseUrl,
                filename,
                fullUrl: imageUrl,
                fileExists: fs.existsSync(svgFile)
            });

            return {
                dotString,
                imageUrl,
                visualizationPath: svgFile
            };
        } catch (error) {
            console.error('Error generating visualization:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                cwd: process.cwd(),
                nodeEnv: process.env.NODE_ENV,
                baseUrl: process.env.BASE_URL,
                visualizationsDir: this.visualizationsDir,
                dotString: dotString || 'Not generated'
            });

            // Create a simple error SVG
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            const errorFilename = `error-${timestamp}-${random}.svg`;
            const errorFile = path.join(this.visualizationsDir, errorFilename);
            
            const errorSvg = `
            <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="45%" text-anchor="middle" fill="#dc3545" font-family="Arial">
                    Error generating visualization
                </text>
                <text x="50%" y="55%" text-anchor="middle" fill="#6c757d" font-size="14" font-family="Arial">
                    ${error.message || 'Unknown error'}
                </text>
            </svg>`;

            try {
                fs.writeFileSync(errorFile, errorSvg);
                console.log('Saved error SVG to:', errorFile);
            } catch (writeError) {
                console.error('Error saving error SVG:', writeError);
                throw writeError;
            }

            // Generate error URL
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const errorUrl = `${baseUrl}/visualizations/${errorFilename}`;

            return {
                dotString: '',
                imageUrl: errorUrl,
                visualizationPath: errorFile,
                error: error.message || 'Unknown error'
            };
        }
    }

    generateBasicTreeSvg(data, root) {
        // Helper function to calculate node positions
        const calculatePositions = (node, x = 0, y = 0, level = 0, width = this.width) => {
            const nodeWidth = 200;
            const nodeHeight = 40;
            const verticalGap = 60;
            
            node.x = x;
            node.y = y;
            
            if (node.children && node.children.length > 0) {
                const childWidth = width / node.children.length;
                node.children.forEach((child, index) => {
                    const childX = x - width/2 + childWidth * (index + 0.5);
                    const childY = y + nodeHeight + verticalGap;
                    calculatePositions(child, childX, childY, level + 1, childWidth);
                });
            }
        };

        // Calculate positions for all nodes
        calculatePositions(root, this.width/2, 50);

        // Generate SVG
        let svg = `
        <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
                </marker>
            </defs>
            <style>
                .node { filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.2)); }
                .link { stroke: #666; stroke-width: 1.5px; marker-end: url(#arrowhead); }
                text { font-family: Arial; fill: white; }
            </style>`;

        // Helper function to render a node and its children
        const renderNode = (node) => {
            // Add node
            const color = node.type === 'workspace' ? '#4A90E2' : 
                         node.type === 'collection' ? '#7ED321' : 
                         node.type === 'collection_view_page' ? '#F5A623' : '#D0021B';
            
            svg += `
            <g class="node" transform="translate(${node.x-100},${node.y})">
                <rect width="200" height="40" rx="5" fill="${color}" class="node"/>
                <text x="100" y="25" text-anchor="middle">${node.title}</text>
            </g>`;

            // Add links to children
            if (node.children) {
                node.children.forEach(child => {
                    svg += `
                    <path class="link" d="M ${node.x} ${node.y+40} L ${node.x} ${node.y+50} L ${child.x} ${child.y-10} L ${child.x} ${child.y}"/>`;
                    renderNode(child);
                });
            }
        };

        // Render the tree
        renderNode(root);
        svg += '</svg>';
        return svg;
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