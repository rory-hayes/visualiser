document.addEventListener('DOMContentLoaded', () => {
    const getStartedButton = document.getElementById('getStarted');
    if (getStartedButton) {
        // Landing page logic
        getStartedButton.addEventListener('click', () => {
            window.location.href = '/auth';
        });
    } else {
        // Graph rendering logic for /redirect
        renderGraph();
    }
});

async function renderGraph() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('No data available. Authenticate first.');

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
            .attr('x1', (d) => d.source.x || 0)
            .attr('y1', (d) => d.source.y || 0)
            .attr('x2', (d) => d.target.x || 0)
            .attr('y2', (d) => d.target.y || 0)
            .attr('stroke', '#ccc');

        // Render nodes
        svg.selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('circle')
            .attr('cx', (d) => d.x || Math.random() * width)
            .attr('cy', (d) => d.y || Math.random() * height)
            .attr('r', 10)
            .attr('fill', (d) => (d.type === 'database' ? '#4CAF50' : '#2196F3'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        svg.selectAll('text')
            .data(graph.nodes)
            .enter()
            .append('text')
            .attr('x', (d) => (d.x || Math.random() * width) + 12)
            .attr('y', (d) => (d.y || Math.random() * height) + 4)
            .text((d) => d.name || 'Unnamed')
            .style('font-size', '12px')
            .attr('fill', '#333');
    } catch (error) {
        console.error('Error rendering graph:', error);
    }
}