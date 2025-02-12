import { graphviz } from 'd3-graphviz';
import { BaseVisualizer } from './BaseVisualizer.js';

export class TreeVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.maxDepth = 4; // Limit visualization to 4 levels
    }

    processHierarchy(data) {
        this.validateData(data);

        // Create nodes map
        const nodesMap = new Map();
        const rootNodes = [];

        // First pass: create all nodes
        data.forEach(item => {
            const node = {
                id: item.ID,
                title: item.TEXT || 'Untitled',
                type: item.TYPE || 'page',
                depth: parseInt(item.DEPTH) || 0,
                parent: item.PARENT_ID,
                children: []
            };
            nodesMap.set(node.id, node);
        });

        // Second pass: build hierarchy
        nodesMap.forEach(node => {
            if (node.parent && nodesMap.has(node.parent)) {
                const parentNode = nodesMap.get(node.parent);
                parentNode.children.push(node);
            } else {
                rootNodes.push(node);
            }
        });

        return rootNodes;
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
            const label = node.title.length > 20 ? 
                node.title.substring(0, 17) + '...' : 
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

            // Add interactivity
            this.addInteractivity(container);

            // Return the DOT string for potential export
            return dotString;
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