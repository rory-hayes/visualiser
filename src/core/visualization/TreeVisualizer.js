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
            title: 'Workspace',
            type: 'workspace',
            depth: 0,
            children: [
                {
                    id: `${data.SPACE_ID}_pages`,
                    title: `Pages`,
                    value: data.PAGE_COUNT,
                    type: 'pages',
                    depth: 1,
                    children: []
                },
                {
                    id: `${data.SPACE_ID}_collections`,
                    title: `Collections`,
                    value: data.COLLECTION_COUNT,
                    type: 'collections',
                    depth: 1,
                    children: []
                },
                {
                    id: `${data.SPACE_ID}_collection_views`,
                    title: `Collection Views`,
                    value: data.COLLECTION_VIEW_COUNT,
                    type: 'collection_views',
                    depth: 1,
                    children: []
                },
                {
                    id: `${data.SPACE_ID}_collection_view_pages`,
                    title: `Collection View Pages`,
                    value: data.COLLECTION_VIEW_PAGE_COUNT,
                    type: 'collection_view_pages',
                    depth: 1,
                    children: []
                },
                {
                    id: `${data.SPACE_ID}_tables`,
                    title: `Tables`,
                    value: data.TABLE_COUNT,
                    type: 'tables',
                    depth: 1,
                    children: []
                },
                {
                    id: `${data.SPACE_ID}_table_rows`,
                    title: `Table Rows`,
                    value: data.TABLE_ROW_COUNT,
                    type: 'table_rows',
                    depth: 1,
                    children: []
                }
            ]
        };

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
        // Configure graph layout for better readability
        dot += '  graph [rankdir=TB, splines=polyline, ranksep=1.2, nodesep=1.0];\n';
        dot += '  node [shape=box, style="rounded,filled", fontname="Arial", fontsize=12, margin=0.3];\n';
        dot += '  edge [color="#666666", penwidth=1.5, arrowsize=0.8];\n\n';

        // Add graph title
        dot += '  labelloc="t";\n';
        dot += '  label="Workspace Structure";\n';
        dot += '  fontname="Arial";\n';
        dot += '  fontsize=16;\n\n';

        const processNode = (node, parentId = null) => {
            // Node styling based on type
            let color, fontcolor, shape;
            switch (node.type) {
                case 'workspace':
                    color = '#4A90E2';
                    fontcolor = 'white';
                    shape = 'box';
                    break;
                case 'collection':
                    color = '#7ED321';
                    fontcolor = 'white';
                    shape = 'box';
                    break;
                case 'collection_view_page':
                    color = '#F5A623';
                    fontcolor = 'white';
                    shape = 'box';
                    break;
                case 'page':
                    color = '#D0021B';
                    fontcolor = 'white';
                    shape = 'box';
                    break;
                default:
                    color = '#E8E8E8';
                    fontcolor = 'black';
                    shape = 'box';
            }

            // Create HTML-like label with type and title
            const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1).replace(/_/g, ' ');
            const titleLabel = node.title.length > 30 ? 
                node.title.substring(0, 27) + '...' : 
                node.title;

            // Add node definition with enhanced styling
            dot += `  "${node.id}" [label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4">
                <TR><TD><FONT COLOR="${fontcolor}" POINT-SIZE="10"><I>${typeLabel}</I></FONT></TD></TR>
                <TR><TD><FONT COLOR="${fontcolor}" POINT-SIZE="12"><B>${titleLabel}</B></FONT></TD></TR>
                </TABLE>>, 
                shape="${shape}", 
                fillcolor="${color}", 
                style="rounded,filled"];\n`;

            // Add edge with styling if there's a parent
            if (parentId) {
                dot += `  "${parentId}" -> "${node.id}" [dir=forward];\n`;
            }

            // Process children if not aggregated
            if (!node.isAggregated && node.children) {
                // Create invisible subgraph for better layout
                dot += `  subgraph cluster_${node.id} {\n`;
                dot += `    style=invis;\n`;
                node.children.forEach(child => processNode(child, node.id));
                dot += `  }\n`;
            }
        };

        // Add legend
        dot += '  subgraph cluster_legend {\n';
        dot += '    label="Legend";\n';
        dot += '    fontname="Arial";\n';
        dot += '    fontsize=12;\n';
        dot += '    style="rounded";\n';
        dot += '    color="#666666";\n';
        dot += '    legend_workspace [label="Workspace", shape=box, style="rounded,filled", fillcolor="#4A90E2", fontcolor="white"];\n';
        dot += '    legend_collection [label="Collection", shape=box, style="rounded,filled", fillcolor="#7ED321", fontcolor="white"];\n';
        dot += '    legend_cvp [label="Collection View Page", shape=box, style="rounded,filled", fillcolor="#F5A623", fontcolor="white"];\n';
        dot += '    legend_page [label="Page", shape=box, style="rounded,filled", fillcolor="#D0021B", fontcolor="white"];\n';
        dot += '    {rank=same; legend_workspace legend_collection legend_cvp legend_page}\n';
        dot += '  }\n\n';

        hierarchy.forEach(root => processNode(root));
        dot += '}';
        return dot;
    }

    async generateVisualization(data) {
        try {
            // Process data into hierarchy
            const hierarchy = this.processHierarchy(data);
            
            // Generate unique filename for SVG
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            const filename = `tree-${timestamp}-${random}.svg`;
            const svgFile = path.join(this.visualizationsDir, filename);

            // Generate SVG content
            const svg = this.generateBasicTreeSvg(data, hierarchy[0]);
            
            // Ensure visualizations directory exists
            await fs.promises.mkdir(this.visualizationsDir, { recursive: true });
            
            // Save the SVG with proper permissions
            try {
                await fs.promises.writeFile(svgFile, svg, { 
                    encoding: 'utf8',
                    mode: 0o644 // Readable by all, writable by owner
                });
                
                console.log('Successfully wrote SVG file:', {
                    path: svgFile,
                    size: (await fs.promises.stat(svgFile)).size
                });
                
                // Verify the file was created and has content
                if (!fs.existsSync(svgFile)) {
                    throw new Error('SVG file was not created');
                }

                const fileStats = fs.statSync(svgFile);
                if (fileStats.size === 0) {
                    throw new Error('SVG file is empty');
                }

                // Log environment and file information
                console.log('Environment variables:', {
                    NODE_ENV: process.env.NODE_ENV,
                    BASE_URL: process.env.BASE_URL,
                    visualizationsDir: this.visualizationsDir,
                    svgFile,
                    fileExists: fs.existsSync(svgFile),
                    fileSize: fileStats.size
                });

                // Determine the base URL with fallbacks
                let baseUrl = process.env.BASE_URL;
                if (!baseUrl) {
                    baseUrl = process.env.NODE_ENV === 'production' 
                        ? 'https://visualiser-xhjh.onrender.com'
                        : 'http://localhost:3000';
                }

                // Ensure the base URL doesn't have a trailing slash
                baseUrl = baseUrl.replace(/\/$/, '');

                // Generate the full URL for the image
                const imageUrl = `${baseUrl}/visualizations/${filename}`;
                
                console.log('Generated visualization:', {
                    baseUrl,
                    filename,
                    fullUrl: imageUrl,
                    fileExists: fs.existsSync(svgFile),
                    fileSize: fileStats.size
                });

                return {
                    imageUrl,
                    visualizationPath: svgFile
                };

            } catch (writeError) {
                console.error('Error writing SVG file:', writeError);
                throw writeError;
            }

        } catch (error) {
            console.error('Error generating visualization:', error);
            
            // Create error SVG
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            const errorFilename = `error-${timestamp}-${random}.svg`;
            const errorFile = path.join(this.visualizationsDir, errorFilename);
            
            const errorSvg = `<?xml version="1.0" encoding="UTF-8"?>
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
                await fs.promises.mkdir(this.visualizationsDir, { recursive: true });
                await fs.promises.writeFile(errorFile, errorSvg, {
                    encoding: 'utf8',
                    mode: 0o644
                });
                
                console.log('Saved error SVG to:', errorFile);

                // Verify error file was created
                if (!fs.existsSync(errorFile)) {
                    throw new Error('Error SVG file was not created');
                }

                const fileStats = fs.statSync(errorFile);
                if (fileStats.size === 0) {
                    throw new Error('Error SVG file is empty');
                }

                // Determine base URL
                const baseUrl = process.env.BASE_URL || 
                    (process.env.NODE_ENV === 'production' 
                        ? 'https://visualiser-xhjh.onrender.com'
                        : 'http://localhost:3000');

                const errorUrl = `${baseUrl}/visualizations/${errorFilename}`;

                return {
                    imageUrl: errorUrl,
                    visualizationPath: errorFile,
                    error: error.message || 'Unknown error'
                };
            } catch (writeError) {
                console.error('Error saving error SVG:', writeError);
                throw writeError;
            }
        }
    }

    generateBasicTreeSvg(data, root) {
        // Convert the data to a hierarchy
        const hierarchy = d3.hierarchy(root)
            .sum(d => {
                // Use the actual values for sizing
                if (d.value !== undefined) {
                    return Math.max(d.value, 10); // Ensure minimum size for visibility
                }
                return 100; // Default size for root
            })
            .sort((a, b) => b.value - a.value);

        // Create treemap layout
        const treemap = d3.treemap()
            .size([this.width, this.height])
            .paddingTop(28) // Increased padding for better readability
            .paddingRight(3)
            .paddingBottom(3)
            .paddingLeft(3)
            .round(true);

        // Compute the layout
        const rootNode = treemap(hierarchy);

        // Generate SVG
        let svg = `
        <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="1" dy="1"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <style>
                .node { filter: url(#dropShadow); }
                .node-label { font-family: Arial; fill: white; }
                .node-value { font-family: Arial; fill: white; opacity: 0.9; }
                .title { font-family: Arial; font-size: 20px; fill: #333; }
            </style>
            <text x="${this.width/2}" y="30" text-anchor="middle" class="title">
                Workspace Structure
            </text>`;

        // Helper function to render a node
        const renderNode = (node) => {
            if (!node.children) {
                const colorMap = {
                    pages: '#4A90E2',
                    collections: '#7ED321',
                    collection_views: '#F5A623',
                    collection_view_pages: '#BD10E0',
                    tables: '#9013FE',
                    table_rows: '#D0021B',
                    default: '#94A3B8'
                };

                const color = colorMap[node.data.type] || colorMap.default;
                const width = Math.max(0, node.x1 - node.x0);
                const height = Math.max(0, node.y1 - node.y0);

                // Skip tiny rectangles
                if (width < 1 || height < 1) return;

                svg += `
                <g class="node" transform="translate(${node.x0},${node.y0})">
                    <rect 
                        width="${width}"
                        height="${height}"
                        fill="${color}"
                        fill-opacity="0.8"
                        rx="4"
                    />`;

                // Only add text if the rectangle is big enough
                if (width > 50 && height > 30) {
                    const typeLabel = node.data.title;
                    const value = node.data.value.toLocaleString();

                    svg += `
                        <text x="5" y="15" class="node-label" style="font-size: ${Math.min(width/15, 12)}px">
                            ${typeLabel}
                        </text>
                        <text x="5" y="${Math.min(height/2 + 10, height - 5)}" class="node-value" style="font-size: ${Math.min(width/15, 14)}px">
                            ${value}
                        </text>`;
                }

                svg += `</g>`;
            }
        };

        // Render all leaf nodes
        rootNode.leaves().forEach(renderNode);

        // Add legend
        const legendY = this.height - 40;
        const legendItems = [
            { type: 'Pages', color: '#4A90E2' },
            { type: 'Collections', color: '#7ED321' },
            { type: 'Collection Views', color: '#F5A623' },
            { type: 'Collection View Pages', color: '#BD10E0' },
            { type: 'Tables', color: '#9013FE' },
            { type: 'Table Rows', color: '#D0021B' }
        ];

        legendItems.forEach((item, i) => {
            const x = 20 + i * 180; // Increased spacing for longer labels
            svg += `
                <g transform="translate(${x},${legendY})">
                    <rect width="20" height="20" rx="4" fill="${item.color}" fill-opacity="0.8"/>
                    <text x="30" y="15" font-family="Arial" font-size="12">${item.type}</text>
                </g>`;
        });

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