import * as d3 from 'd3';

export function generateGraph(container, data) {
    // Clear any existing content
    d3.select(container).selectAll("*").remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create the SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom functionality
    const g = svg.append('g');
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        }));

    // Define node colors and sizes
    const nodeColors = {
        workspace: '#6366f1', // Indigo
        database: '#22c55e', // Green
        page: '#3b82f6',     // Blue
        child_page: '#8b5cf6' // Purple
    };

    const nodeSize = {
        workspace: 20,
        database: 15,
        page: 10,
        child_page: 8
    };

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links)
            .id(d => d.id)
            .distance(100))
        .force('charge', d3.forceManyBody()
            .strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

    // Create arrow marker for links
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');

    // Create links
    const link = g.append('g')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrowhead)');

    // Create node containers
    const node = g.append('g')
        .selectAll('.node')
        .data(data.nodes)
        .join('g')
        .attr('class', 'node')
        .call(drag(simulation));

    // Add circles to nodes
    node.append('circle')
        .attr('r', d => nodeSize[d.type] || 10)
        .attr('fill', d => nodeColors[d.type] || '#999')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
        .attr('dx', 15)
        .attr('dy', '.35em')
        .text(d => d.name)
        .attr('font-size', '12px')
        .attr('fill', '#374151');

    // Add hover effects
    node.on('mouseover', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', r => nodeSize[d.type] * 1.2);

        // Show tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        tooltip.html(`
            <div class="p-2">
                <div class="font-bold">${d.name}</div>
                <div class="text-sm text-gray-600">${d.type}</div>
                ${d.url ? `<div class="text-xs text-blue-600">Click to open</div>` : ''}
            </div>
        `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', nodeSize[d.type]);

        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    })
    .on('click', (event, d) => {
        if (d.url) {
            window.open(d.url, '_blank');
        }
    });

    // Create tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '4px')
        .style('pointer-events', 'none')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');

    // Update force simulation on tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    return {
        update: (newData) => {
            // Update simulation with new data
            simulation.nodes(newData.nodes);
            simulation.force('link').links(newData.links);
            simulation.alpha(1).restart();
        }
    };
}