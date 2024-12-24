export function generateGraph(container, data) {
    try {
        console.log('Starting graph generation');
        
        if (!window.d3) {
            console.error('D3 not found!');
            return null;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Clear existing content
        d3.select(container).selectAll("*").remove();

        // Create SVG with zoom support
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('border', '1px solid #ccc');

        const g = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links)
                .id(d => d.id)
                .distance(d => {
                    if (d.source.type === 'workspace') return 200;
                    if (d.source.type === 'database' || d.target.type === 'database') return 150;
                    return 100;
                }))
            .force('charge', d3.forceManyBody()
                .strength(d => {
                    if (d.type === 'workspace') return -800;
                    if (d.type === 'database') return -400;
                    return -200;
                }))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => (nodeSize[d.type] || 10) * 2));

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
            .selectAll('g')
            .data(data.nodes)
            .join('g')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Add circles to nodes
        node.append('circle')
            .attr('r', d => nodeSize[d.type] || 10)
            .attr('fill', d => nodeColors[d.type] || '#999')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', d => d.url ? 'pointer' : 'default')
            .on('click', (event, d) => {
                if (d.url) window.open(d.url, '_blank');
            });

        // Add labels
        node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => d.name)
            .style('font-size', '12px')
            .style('fill', '#333');

        // Add tooltips
        node.on('mouseover', (event, d) => {
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
        })
        .on('mouseout', () => {
            d3.selectAll('.tooltip')
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();
        });

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
            d.fx = event.x;
            d.fy = event.y;
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

        return {
            simulation,
            svg,
            update: (newData) => {
                simulation.nodes(newData.nodes);
                simulation.force('link').links(newData.links);
                simulation.alpha(1).restart();
            },
            cleanup: () => {
                simulation.stop();
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}