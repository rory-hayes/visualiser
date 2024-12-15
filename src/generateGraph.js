export function generateGraph(container, data) {
    if (!window.d3) {
        console.error('D3 not found! Make sure d3 is loaded before calling generateGraph');
        return null;
    }

    const d3Instance = window.d3;
    
    if (!container || !data) {
        console.error('Container or data is missing:', { hasContainer: !!container, hasData: !!data });
        return null;
    }

    console.log('Initializing graph with:', {
        containerSize: {
            width: container.clientWidth,
            height: container.clientHeight
        },
        dataSize: {
            nodes: data.nodes.length,
            links: data.links.length
        }
    });

    // Clear any existing content
    d3Instance.select(container).selectAll("*").remove();

    const width = container.clientWidth;
    const height = container.clientHeight;
    const g = d3Instance.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [0, 0, width, height])
        .style('max-width', '100%')
        .style('height', 'auto')
        .append('g');

    // Add zoom support
    const zoom = d3Instance.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    d3Instance.select(container).select('svg').call(zoom);

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
    const simulation = d3Instance.forceSimulation(data.nodes)
        .force('link', d3Instance.forceLink(data.links)
            .id(d => d.id)
            .distance(100))
        .force('charge', d3Instance.forceManyBody().strength(-400))
        .force('center', d3Instance.forceCenter(width / 2, height / 2))
        .force('collision', d3Instance.forceCollide().radius(50));

    // Create links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);

    // Create nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .enter()
        .append('g')
        .call(d3Instance.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

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
        .style('font-size', '12px')
        .style('fill', '#374151');

    // Add title for hover tooltip
    node.append('title')
        .text(d => `${d.name} (${d.type})`);

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

    // Add zoom controls
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetZoom = document.getElementById('resetZoom');

    if (zoomIn) {
        zoomIn.onclick = () => {
            d3Instance.select(container).select('svg')
                .transition()
                .duration(300)
                .call(zoom.scaleBy, 1.2);
        };
    }

    if (zoomOut) {
        zoomOut.onclick = () => {
            d3Instance.select(container).select('svg')
                .transition()
                .duration(300)
                .call(zoom.scaleBy, 0.8);
        };
    }

    if (resetZoom) {
        resetZoom.onclick = () => {
            d3Instance.select(container).select('svg')
                .transition()
                .duration(300)
                .call(zoom.transform, d3Instance.zoomIdentity);
        };
    }

    return {
        update: (newData) => {
            if (!newData || !newData.nodes || !newData.links) {
                console.error('Invalid data provided to update');
                return;
            }
            simulation.nodes(newData.nodes);
            simulation.force('link').links(newData.links);
            simulation.alpha(1).restart();
            console.log('Graph updated with new data:', {
                nodes: newData.nodes.length,
                links: newData.links.length
            });
        }
    };
}