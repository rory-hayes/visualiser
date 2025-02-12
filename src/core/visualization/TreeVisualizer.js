import { graphviz } from 'd3-graphviz';
import { BaseVisualizer } from './BaseVisualizer.js';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import FormData from 'form-data';

export class TreeVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.maxDepth = 4; // Limit visualization to 4 levels
        // Create a virtual DOM for server-side rendering
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        this.width = 1200;
        this.height = 800;
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

    async generateVisualization(data, containerId) {
        try {
            // Process data into hierarchy
            const hierarchy = this.processHierarchy(data);
            
            // Aggregate deep branches
            const processedHierarchy = hierarchy.map(root => 
                this.aggregateDeepBranches(root));

            // Generate DOT string
            const dotString = this.generateDotString(processedHierarchy);

            // Render using d3-graphviz
            const container = document.querySelector(`#${containerId}`);
            if (!container) {
                throw new Error(`Container #${containerId} not found`);
            }

            const graphvizInstance = graphviz(container)
                .width(container.clientWidth || this.width)
                .height(container.clientHeight || this.height)
                .fit(true)
                .zoom(false);

            // Add transition for smooth rendering
            graphvizInstance
                .transition(function() {
                    return d3.transition()
                        .duration(1000)
                        .ease(d3.easeLinear);
                });

            // Render the graph
            await graphvizInstance.renderDot(dotString);

            // Export as PNG
            const svg = container.querySelector('svg');
            const imageUrl = await this.exportAsPNG(svg);

            return {
                dotString,
                imageUrl
            };
        } catch (error) {
            console.error('Error generating visualization:', error);
            throw error;
        }
    }

    async exportAsPNG(svg) {
        try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions
            const svgRect = svg.getBoundingClientRect();
            canvas.width = svgRect.width * 2; // 2x for better resolution
            canvas.height = svgRect.height * 2;
            ctx.scale(2, 2);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    // Convert canvas to blob
                    canvas.toBlob(async (blob) => {
                        try {
                            // Create form data
                            const formData = new FormData();
                            formData.append('image', blob, 'tree-visualization.png');

                            // Upload to server
                            const response = await fetch('/api/upload-visualization', {
                                method: 'POST',
                                body: formData
                            });

                            if (!response.ok) {
                                throw new Error('Failed to upload visualization');
                            }

                            const { imageUrl } = await response.json();
                            resolve(imageUrl);
                        } catch (error) {
                            reject(error);
                        }
                    }, 'image/png');
                };
                img.onerror = reject;
                img.src = url;
            });
        } catch (error) {
            console.error('Error exporting PNG:', error);
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

    async visualizeWorkspace(data) {
        try {
            // Transform data into hierarchical structure
            const hierarchicalData = this.transformData(data);
            
            // Create and upload visualization
            const imageUrl = await this.createVisualization(hierarchicalData);
            return imageUrl;
        } catch (error) {
            console.error('Error visualizing workspace:', error);
            return null;
        }
    }

    transformData(data) {
        // Create root node
        const root = {
            name: 'Workspace',
            children: []
        };

        // Add collections
        if (data.collections && data.collections.length > 0) {
            const collectionsNode = {
                name: 'Collections',
                type: 'collection',
                children: data.collections.map(collection => ({
                    name: collection.title || 'Untitled Collection',
                    type: 'collection',
                    value: 1
                }))
            };
            root.children.push(collectionsNode);
        }

        // Add collection view pages
        if (data.collection_view_pages && data.collection_view_pages.length > 0) {
            const cvpNode = {
                name: 'Collection View Pages',
                type: 'collection_view_page',
                children: data.collection_view_pages.map(cvp => ({
                    name: cvp.title || 'Untitled CVP',
                    type: 'collection_view_page',
                    value: 1
                }))
            };
            root.children.push(cvpNode);
        }

        // Add regular pages
        if (data.pages && data.pages.length > 0) {
            const pagesNode = {
                name: 'Pages',
                type: 'page',
                children: data.pages.map(page => ({
                    name: page.title || 'Untitled Page',
                    type: 'page',
                    value: 1
                }))
            };
            root.children.push(pagesNode);
        }

        return root;
    }

    async createVisualization(data) {
        const svg = d3.create("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        // Create the treemap layout
        const root = d3.hierarchy(data)
            .sum(d => d.value || 1);

        d3.treemap()
            .size([this.width, this.height])
            .padding(1)
            (root);

        // Add rectangles for each leaf node
        const leaf = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        leaf.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => this.getColorForType(d.data.type));

        // Add text labels
        leaf.append("text")
            .attr("x", 3)
            .attr("y", 20)
            .text(d => this.truncateLabel(d.data.name))
            .attr("font-size", "15px")
            .attr("fill", "white");

        // Convert SVG to string
        const svgString = svg.node().outerHTML;

        // Upload the visualization and get the URL
        const imageUrl = await this.uploadVisualization(svgString);
        return imageUrl;
    }

    async uploadVisualization(svgString) {
        try {
            // Convert SVG to PNG using canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.width = this.width;
            canvas.height = this.height;
            
            // Create a Blob from the SVG string
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const URL = global.URL || global.webkitURL || window;
            const blobUrl = URL.createObjectURL(svgBlob);
            
            // Create image from SVG
            const img = new Image();
            
            // Convert to base64 and create FormData
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, 'tree-visualization.png');

            // Upload to server
            const uploadResponse = await fetch('http://localhost:3000/api/upload-visualization', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload visualization');
            }

            const result = await uploadResponse.json();
            return result.imageUrl;

        } catch (error) {
            console.error('Error uploading visualization:', error);
            return null;
        }
    }

    truncateLabel(label) {
        return label.length > 20 ? label.substring(0, 17) + "..." : label;
    }

    getColorForType(type) {
        const colorMap = {
            'collection': '#2ecc71',
            'collection_view': '#3498db',
            'collection_view_page': '#9b59b6',
            'page': '#e74c3c',
            'default': '#95a5a6'
        };
        return colorMap[type] || colorMap.default;
    }
} 