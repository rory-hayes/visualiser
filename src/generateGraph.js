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

        // Validate and prepare data
        const nodes = data.nodes.map(node => ({
            ...node,
            id: node.id,
            name: node.name || 'Untitled',
            type: node.type || 'page'
        }));

        const links = data.links.map(link => ({
            source: typeof link.source === 'object' ? link.source.id : link.source,
            target: typeof link.target === 'object' ? link.target.id : link.target
        }));

        // Set up dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Clear existing content
        d3.select(container).selectAll("*").remove();

        // Create SVG with zoom support
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        const g = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom);

        // Create force simulation with improved forces
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(d => {
                    // Adjust link distances based on node types
                    if (d.source.type === 'workspace') return 200;
                    if (d.source.type === 'database' || d.target.type === 'database') return 150;
                    return 100;
                }))
            .force('charge', d3.forceManyBody()
                .strength(d => {
                    // Adjust repulsion forces based on node type
                    if (d.type === 'workspace') return -1000;
                    if (d.type === 'database') return -500;
                    return -300;
                }))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => nodeSize[d.type] * 1.5)) // Prevent node overlap
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        // Create links with proper styling
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => {
                // Thicker lines for database connections
                return d.source.type === 'database' || d.target.type === 'database' ? 2 : 1;
            });

        // Create node groups
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Add circles to nodes
        node.append('circle')
            .attr('r', d => nodeSize[d.type])
            .attr('fill', d => nodeColors[d.type])
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', d => d.url ? 'pointer' : 'default');

        // Add labels with improved positioning
        node.append('text')
            .attr('dx', d => nodeSize[d.type] + 5)
            .attr('dy', '.35em')
            .text(d => d.name)
            .style('font-size', '12px')
            .style('fill', '#333')
            .each(function(d) {
                // Truncate long labels
                const text = d3.select(this);
                if (this.getComputedTextLength() > 150) {
                    let name = d.name;
                    while (this.getComputedTextLength() > 150) {
                        name = name.slice(0, -1);
                        text.text(name + '...');
                    }
                }
            });

        // Enhanced tooltips
        node.on('mouseover', showTooltip)
            .on('mouseout', hideTooltip)
            .on('click', handleNodeClick);

        // Update force simulation on tick
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

        function showTooltip(event, d) {
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('box-shadow', '0 0 10px rgba(0,0,0,0.1)')
                .style('pointer-events', 'none')
                .style('z-index', 1000)
                .style('opacity', 0);

            tooltip.html(`
                <div class="p-3">
                    <h3 class="font-bold text-gray-900">${d.name}</h3>
                    <p class="text-sm text-gray-600">Type: ${d.type}</p>
                    ${d.lastEdited ? `<p class="text-sm text-gray-600">Last edited: ${formatDate(d.lastEdited)}</p>` : ''}
                    ${d.url ? '<p class="text-xs text-blue-600 mt-1">Click to open in Notion</p>' : ''}
                </div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 1);
        }

        function hideTooltip() {
            d3.selectAll('.tooltip')
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();
        }

        function handleNodeClick(event, d) {
            if (d.url) window.open(d.url, '_blank');
        }

        return {
            simulation,
            svg,
            update: (newData) => {
                simulation.nodes(newData.nodes);
                simulation.force('link').links(newData.links);
                simulation.alpha(1).restart();
            }
        };

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