export function generateGraph(container, data) {
    try {
        console.log('Starting graph generation');
        
        if (!window.d3) {
            console.error('D3 not found!');
            return null;
        }

        if (!container || !data?.nodes?.length) {
            console.error('Invalid container or data:', { 
                hasContainer: !!container, 
                dataNodes: data?.nodes?.length 
            });
            return null;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        console.log('Container dimensions:', { width, height });

        // Clear existing content
        d3.select(container).selectAll("*").remove();

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('border', '1px solid #ccc');

        // Add a background rect for debugging
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#f8fafc');

        const g = svg.append('g');

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);

        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(data.nodes)
            .join('circle')
            .attr('r', d => nodeSize[d.type] || 10)
            .attr('fill', d => nodeColors[d.type] || '#999')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Add labels
        const labels = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(data.nodes)
            .join('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => d.name)
            .style('font-size', '12px')
            .style('fill', '#333');

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // Drag functions
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

        console.log('Graph generation complete');
        return { simulation, svg };

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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}