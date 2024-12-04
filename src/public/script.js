document.getElementById('getStarted').addEventListener('click', () => {
    window.location.href = '/auth';
});

// Fetch and render the graph
async function renderGraph() {
    try {
        const response = await fetch('/graph');
        const { graph, score } = await response.json();

        // Display workspace score
        document.getElementById('workspaceScore').innerText = `Workspace Score: ${score}`;

        const width = 800;
        const height = 600;

        // Setup SVG for D3
        const svg = d3
            .select('#visualization')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(
                d3
                    .zoom()
                    .scaleExtent([0.5, 2])
                    .on('zoom', (event) => {
                        svg.attr('transform', event.transform);
                    })
            )
            .append('g');

        // Render links
        svg.selectAll('line')
            .data(graph.links)
            .enter()
            .append('line')
            .attr('x1', (d) => d.source.x)
            .attr('y1', (d) => d.source.y)
            .attr('x2', (d) => d.target.x)
            .attr('y2', (d) => d.target.y)
            .attr('stroke', '#ccc');

        // Render nodes
        svg.selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('circle')
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 10)
            .attr('fill', (d) => (d.type === 'database' ? '#4CAF50' : '#2196F3'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        svg.selectAll('text')
            .data(graph.nodes)
            .enter()
            .append('text')
            .attr('x', (d) => d.x + 12)
            .attr('y', (d) => d.y)
            .text((d) => d.name || 'Unnamed')
            .style('font-size', '12px')
            .attr('fill', '#333');
    } catch (error) {
        console.error('Error rendering graph:', error);
    }
}

// Load the graph when the page loads
window.onload = renderGraph;