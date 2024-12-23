export function generateGraph(container, data) {
    if (!window.d3) {
        console.error('D3 not found!');
        return null;
    }

    const d3Instance = window.d3;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing content
    d3Instance.select(container).selectAll("*").remove();

    // Create SVG
    const svg = d3Instance.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [-width/2, -height/2, width, height])
        .style('max-width', '100%')
        .style('height', 'auto');

    const g = svg.append('g');

    // Setup zoom with better defaults
    const zoom = d3Instance.zoom()
        .scaleExtent([0.2, 2])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);
    
    // Set initial zoom based on node count
    const scale = Math.min(1, 1000 / (data.nodes.length * 100));
    svg.call(zoom.transform, d3Instance.zoomIdentity
        .translate(0, 0)
        .scale(scale));

    // Optimize simulation for Notion hierarchy
    const simulation = d3Instance.forceSimulation(data.nodes)
        .force('link', d3Instance.forceLink(data.links)
            .id(d => d.id)
            .distance(d => {
                // Adjust distances based on Notion hierarchy
                if (d.source.type === 'workspace') return 200;
                if (d.source.type === 'database' || d.target.type === 'database') return 150;
                return 100;
            }))
        .force('charge', d3Instance.forceManyBody()
            .strength(d => {
                // Adjust repulsion based on node type
                if (d.type === 'workspace') return -800;
                if (d.type === 'database') return -400;
                return -200;
            }))
        .force('collide', d3Instance.forceCollide()
            .radius(d => (nodeSize[d.type] || 10) * 2))
        .force('x', d3Instance.forceX(0).strength(0.05))
        .force('y', d3Instance.forceY(0).strength(0.05))
        .velocityDecay(0.4);

    // Create links with proper styling
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5);

    // Create node groups
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .join('g')
        .call(d3Instance.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
        .attr('r', d => nodeSize[d.type] || 10)
        .attr('fill', d => nodeColors[d.type] || '#999')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        // Add click handler
        .style('cursor', d => d.url ? 'pointer' : 'default')
        .on('click', (event, d) => {
            if (d.url) {
                window.open(d.url, '_blank');
            }
        })
        // Add tooltip handlers
        .on('mouseover', (event, d) => {
            // Create tooltip
            const tooltip = d3Instance.select('body')
                .append('div')
                .attr('class', 'graph-tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('padding', '10px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
                .style('z-index', 1000)
                .style('opacity', 0);

            // Populate tooltip content
            tooltip.html(`
                <div class="p-3">
                    <h3 class="font-bold text-gray-900">${d.name}</h3>
                    <p class="text-sm text-gray-600">Type: ${d.type}</p>
                    ${d.lastEdited ? `<p class="text-sm text-gray-600">Last edited: ${formatDate(d.lastEdited)}</p>` : ''}
                    ${d.url ? '<p class="text-xs text-blue-600 mt-1">Click to open in Notion</p>' : ''}
                </div>
            `);

            // Position tooltip
            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const xPosition = event.pageX + 10;
            const yPosition = event.pageY - tooltipRect.height - 10;

            // Adjust position if tooltip would go off screen
            const viewportWidth = window.innerWidth;
            const adjustedX = xPosition + tooltipRect.width > viewportWidth 
                ? viewportWidth - tooltipRect.width - 10 
                : xPosition;

            tooltip
                .style('left', `${adjustedX}px`)
                .style('top', `${yPosition}px`)
                .transition()
                .duration(200)
                .style('opacity', 1);

            // Highlight node and connected nodes
            const circle = d3Instance.select(event.target);
            circle
                .transition()
                .duration(200)
                .attr('r', r => (nodeSize[d.type] || 10) * 1.2)
                .attr('stroke', '#ffd700')
                .attr('stroke-width', 3);

            // Highlight connected links
            link.filter(l => l.source === d || l.target === d)
                .transition()
                .duration(200)
                .attr('stroke', '#ffd700')
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 1);
        })
        .on('mouseout', (event, d) => {
            // Remove tooltip
            d3Instance.selectAll('.graph-tooltip')
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();

            // Reset node appearance
            const circle = d3Instance.select(event.target);
            circle
                .transition()
                .duration(200)
                .attr('r', nodeSize[d.type] || 10)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);

            // Reset link appearance
            link.filter(l => l.source === d || l.target === d)
                .transition()
                .duration(200)
                .attr('stroke', '#999')
                .attr('stroke-width', 1.5)
                .attr('stroke-opacity', 0.6);
        });

    // Add text labels with background
    node.append('text')
        .attr('dx', 15)
        .attr('dy', '.35em')
        .text(d => d.name)
        .style('font-size', '12px')
        .style('font-weight', d => d.type === 'workspace' ? 'bold' : 'normal')
        .each(function() {
            const text = d3Instance.select(this);
            const bbox = text.node().getBBox();
            const padding = 2;

            text.insert('rect', 'text')
                .attr('x', bbox.x - padding)
                .attr('y', bbox.y - padding)
                .attr('width', bbox.width + (padding * 2))
                .attr('height', bbox.height + (padding * 2))
                .attr('fill', 'white')
                .attr('fill-opacity', 0.8);
        });

    // Update simulation on tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
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

    // Cleanup function
    function cleanup() {
        simulation.stop();
    }

    return {
        update: (newData) => {
            simulation.nodes(newData.nodes);
            simulation.force('link').links(newData.links);
            simulation.alpha(1).restart();
        },
        cleanup
    };
}

// Update node styling constants
const nodeColors = {
    workspace: '#4f46e5',  // Indigo for workspace
    database: '#059669',   // Green for databases
    page: '#2563eb',      // Blue for pages
    child_page: '#7c3aed' // Purple for child pages
};

const nodeSize = {
    workspace: 20,
    database: 15,
    page: 12,
    child_page: 10
};

// Add helper function for date formatting if not already present
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}