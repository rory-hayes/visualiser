export function generateGraph(container, data) {
    try {
        console.log('Starting graph generation with data:', {
            nodes: data.nodes.length,
            links: data.links.length,
            nodeTypes: data.nodes.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {})
        });

        if (!window.d3) {
            throw new Error('D3 not found');
        }

        // Configuration for force simulation
        const forceConfig = {
            charge: -1000,      // Repulsion strength
            linkDistance: 100,  // Desired link length
            centerForce: 0.1,   // Strength of centering force
            collideRadius: 50   // Node collision radius
        };

        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Create SVG container
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Create a group for the graph
        const g = svg.append('g');

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links)
                .id(d => d.id)
                .distance(forceConfig.linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(forceConfig.charge))
            .force('center', d3.forceCenter(width / 2, height / 2)
                .strength(forceConfig.centerForce))
            .force('collide', d3.forceCollide()
                .radius(forceConfig.collideRadius));

        // Create hierarchical layout for initial positions
        const hierarchy = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent_id)(data.nodes);

        const treeLayout = d3.tree()
            .size([width - 100, height - 100]);

        const treeNodes = treeLayout(hierarchy);

        // Use tree layout for initial positions
        data.nodes.forEach(node => {
            const treeNode = treeNodes.descendants().find(n => n.data.id === node.id);
            if (treeNode) {
                node.x = treeNode.x;
                node.y = treeNode.y;
            }
        });

        // Create links
        const link = g.append('g')
            .selectAll('line')
            .data(data.links)
            .join('line')
            .attr('stroke', d => d.type === 'parent-child' ? '#666' : '#999')
            .attr('stroke-width', d => d.type === 'parent-child' ? 2 : 1)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrow)');

        // Create nodes
        const node = g.append('g')
            .selectAll('circle')
            .data(data.nodes)
            .join('g')
            .call(drag(simulation));

        // Add node circles with different styles based on type
        node.append('circle')
            .attr('r', d => getNodeRadius(d))
            .attr('fill', d => getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add node labels
        node.append('text')
            .text(d => d.title)
            .attr('x', d => getNodeRadius(d) + 5)
            .attr('y', 3)
            .attr('font-size', '12px')
            .attr('font-family', 'Inter, sans-serif');

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Helper functions for node styling
        function getNodeRadius(node) {
            switch (node.type) {
                case 'workspace': return 15;
                case 'database': return 10;
                default: return 7;
            }
        }

        function getNodeColor(node) {
            switch (node.type) {
                case 'workspace': return '#4F46E5';
                case 'database': return '#059669';
                case 'template': return '#D97706';
                default: return '#6366F1';
            }
        }

        return simulation;

    } catch (error) {
        console.error('Error in generateGraph:', error);
        return null;
    }
}

// Node styling constants
const nodeColors = {
    workspace: '#4f46e5',  // Indigo
    database: '#059669',   // Green
    page: '#2563eb',      // Blue
    child_page: '#7c3aed' // Purple
};

const nodeSize = {
    workspace: 20,
    database: 15,
    page: 12,
    child_page: 10
};

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}