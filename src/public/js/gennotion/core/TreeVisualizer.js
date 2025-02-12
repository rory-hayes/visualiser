import * as d3 from 'd3';
import { graphviz } from 'd3-graphviz';

export class TreeVisualizer {
    constructor() {
        this.maxDepth = 4; // Limit visualization to 4 levels
        this.colorMap = {
            page: '#4F46E5',
            collection_view_page: '#10B981',
            collection: '#EC4899',
            database: '#F59E0B',
            table: '#6366F1',
            default: '#94A3B8'
        };
    }

    processHierarchy(data) {
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
            const color = this.colorMap[node.type] || this.colorMap.default;
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
            const container = d3.select(`#${containerId}`);
            container.graphviz()
                .width(container.node().getBoundingClientRect().width)
                .height(600)
                .renderDot(dotString);

            // Return the DOT string for potential export
            return dotString;
        } catch (error) {
            console.error('Error generating visualization:', error);
            throw error;
        }
    }

    // Helper method to export as PNG
    async exportAsPNG(containerId) {
        try {
            const svg = document.querySelector(`#${containerId} svg`);
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create image from SVG
            const img = new Image();
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width * 2;  // 2x for higher resolution
                    canvas.height = img.height * 2;
                    ctx.scale(2, 2);
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob(blob => {
                        resolve(blob);
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
} 