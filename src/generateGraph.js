const LAYOUTS = {
    force: setupForceLayout,
    radial: setupRadialLayout,
    tree: setupTreeLayout,
    disjoint: setupDisjointLayout,
    circle: setupCircleLayout
};

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
        .attr('stroke-width', 2)
        .style('cursor', d => d.url ? 'pointer' : 'default')
        .on('click', (event, d) => {
            if (d.url) {
                window.open(d.url, '_blank');
            }
        })
        .on('mouseover', function(event, d) {
            d3Instance.select(this)
                .transition()
                .duration(200)
                .attr('r', r => (nodeSize[d.type] || 10) * 1.2);

            // Show tooltip
            const tooltip = d3Instance.select(container)
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('padding', '5px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
                .html(`
                    <div class="font-bold">${d.name}</div>
                    <div class="text-sm text-gray-600">${d.type}</div>
                    ${d.url ? '<div class="text-xs text-blue-600">Click to open</div>' : ''}
                `);

            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            tooltip
                .style('left', `${event.pageX - containerRect.left + 10}px`)
                .style('top', `${event.pageY - containerRect.top - tooltipRect.height - 10}px`);
        })
        .on('mouseout', function(event, d) {
            d3Instance.select(this)
                .transition()
                .duration(200)
                .attr('r', nodeSize[d.type] || 10);
            
            d3Instance.selectAll('.tooltip').remove();
        });

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

    // Add layout change listener
    const layoutSelect = document.getElementById('layoutSelect');
    if (layoutSelect) {
        layoutSelect.addEventListener('change', (e) => {
            const newLayout = e.target.value;
            clearGraph();
            LAYOUTS[newLayout](data, g, width, height);
        });
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

// Add layout setup functions
function setupForceLayout(data, g, width, height) {
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

    return renderForceLayout(data, g, simulation);
}

function setupRadialLayout(data, g, width, height) {
    // Create hierarchy
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
            const link = data.links.find(l => l.target === d.id || l.target.id === d.id);
            return link ? (link.source.id || link.source) : null;
        });

    const root = stratify(data.nodes)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name));

    const radius = Math.min(width, height) / 2 - 100;
    
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    return renderRadialLayout(tree(root), g);
}

function setupTreeLayout(data, g, width, height) {
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
            const link = data.links.find(l => l.target === d.id || l.target.id === d.id);
            return link ? (link.source.id || link.source) : null;
        });

    const root = stratify(data.nodes)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name));

    const tree = d3.tree()
        .size([height - 100, width - 200]);

    return renderTreeLayout(tree(root), g);
}

function setupDisjointLayout(data, g, width, height) {
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(50))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('x', d3.forceX(d => {
            if (d.type === 'workspace') return width / 2;
            if (d.type === 'database') return width / 3;
            return 2 * width / 3;
        }))
        .force('y', d3.forceY(height / 2))
        .force('collision', d3.forceCollide().radius(30));

    return renderDisjointLayout(data, g, simulation);
}

function setupCircleLayout(data, g, width, height) {
    const hierarchy = d3.hierarchy({ id: "root", children: data.nodes })
        .sum(d => 1)
        .sort((a, b) => b.value - a.value);

    const pack = d3.pack()
        .size([width - 100, height - 100])
        .padding(3);

    return renderCircleLayout(pack(hierarchy), g);
}

// Add rendering functions for each layout
function renderForceLayout(data, g, simulation) {
    // Links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);

    // Nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .join('g')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Apply styling
    applyNodeStyling(node, g.node().parentNode.parentNode, d3, nodeColors, nodeSize);

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

    return simulation;
}

function renderRadialLayout(root, g) {
    // Links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1)
        .attr('d', d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    // Nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `
            translate(${d.y * Math.cos(d.x - Math.PI / 2)},
                     ${d.y * Math.sin(d.x - Math.PI / 2)})
        `);

    // Apply styling
    applyNodeStyling(node, g.node().parentNode.parentNode, d3, nodeColors, nodeSize);

    return { link, node };
}

function renderTreeLayout(root, g) {
    // Links
    g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add circles and labels
    // ... (add node styling)
}

function renderDisjointLayout(data, g, simulation) {
    // Similar to force layout but with grouped positioning
    // ... (implement disjoint force layout)
}

function renderCircleLayout(root, g) {
    // Circles
    const node = g.append('g')
        .selectAll('g')
        .data(root.descendants().slice(1))
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Add circles and labels
    // ... (add circle packing styling)
}

function applyNodeStyling(node, container, d3Instance, nodeColors, nodeSize) {
    // Add circles
    node.append('circle')
        .attr('r', d => nodeSize[d.data?.type || d.type] || 10)
        .attr('fill', d => nodeColors[d.data?.type || d.type] || '#999')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', d => (d.data?.url || d.url) ? 'pointer' : 'default')
        .on('click', (event, d) => {
            if (d.data?.url || d.url) {
                window.open(d.data?.url || d.url, '_blank');
            }
        })
        .on('mouseover', function(event, d) {
            d3Instance.select(this)
                .transition()
                .duration(200)
                .attr('r', r => (nodeSize[d.data?.type || d.type] || 10) * 1.2);

            // Show tooltip
            const tooltip = d3Instance.select(container)
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'fixed')
                .style('background', 'white')
                .style('padding', '8px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
                .style('z-index', 1000)
                .html(`
                    <div class="font-bold">${d.data?.name || d.name}</div>
                    <div class="text-sm text-gray-600">${d.data?.type || d.type}</div>
                    ${(d.data?.url || d.url) ? '<div class="text-xs text-blue-600">Click to open</div>' : ''}
                    ${d.children ? `<div class="text-xs text-gray-500">${d.descendants().length - 1} descendants</div>` : ''}
                `);

            // Get mouse position relative to the viewport
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            // Get tooltip dimensions
            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();

            // Position tooltip relative to mouse cursor
            tooltip
                .style('left', `${mouseX + 10}px`)
                .style('top', `${mouseY - tooltipRect.height - 10}px`);

            // Adjust if tooltip goes off screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Check right edge
            if (mouseX + 10 + tooltipRect.width > viewportWidth) {
                tooltip.style('left', `${mouseX - tooltipRect.width - 10}px`);
            }

            // Check top edge
            if (mouseY - tooltipRect.height - 10 < 0) {
                tooltip.style('top', `${mouseY + 10}px`);
            }
        })
        .on('mouseout', function(event, d) {
            d3Instance.select(this)
                .transition()
                .duration(200)
                .attr('r', nodeSize[d.data?.type || d.type] || 10);
            
            d3Instance.selectAll('.tooltip').remove();
        });

    // Add labels
    node.append('text')
        .attr('dx', d => nodeSize[d.data?.type || d.type] + 5)
        .attr('dy', '.35em')
        .text(d => d.data?.name || d.name)
        .style('font-size', '12px')
        .style('fill', '#374151')
        .style('text-anchor', 'start');

    return node;
}