let currentLayout = 'force';
let currentGraph = null;

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
    const svg = d3Instance.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [0, 0, width, height])
        .style('max-width', '100%')
        .style('height', 'auto');

    const g = svg.append('g');

    // Add zoom support
    const zoom = d3Instance.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    setupZoomControls(svg, g, zoom);

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
            const tooltip = d3Instance.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('padding', '8px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
                .style('z-index', 1000)
                .html(`
                    <div class="font-bold">${d.name}</div>
                    <div class="text-sm text-gray-600">${d.type}</div>
                    ${d.url ? '<div class="text-xs text-blue-600">Click to open</div>' : ''}
                `);

            // Position tooltip using page coordinates
            tooltip
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
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

    // Add layout change listener
    const layoutSelect = document.getElementById('layoutSelect');
    if (layoutSelect) {
        layoutSelect.value = currentLayout; // Set initial value
        layoutSelect.addEventListener('change', (e) => {
            currentLayout = e.target.value;
            console.log('Switching to layout:', currentLayout);
            currentGraph = switchLayout(currentLayout, data, g, width, height);
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
        .force('link', d3.forceLink(data.links)
            .id(d => d.id)
            .distance(100))
        .force('charge', d3.forceManyBody()
            .strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

    const { link, node } = renderBaseGraph(data, g);
    
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

function setupRadialLayout(data, g, width, height) {
    const hierarchy = createHierarchy(data);
    const radius = Math.min(width, height) / 2 - 100;
    
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = tree(hierarchy);

    // Position nodes
    const nodes = root.descendants().map(d => ({
        ...d.data,
        x: d.x,
        y: d.y,
        parent: d.parent?.data
    }));

    // Create links
    const links = root.links().map(d => ({
        source: d.source.data,
        target: d.target.data
    }));

    const { link, node } = renderBaseGraph({ nodes, links }, g);

    // Position nodes in a radial layout
    node.attr('transform', d => `
        translate(${d.y * Math.cos(d.x - Math.PI / 2)},
                 ${d.y * Math.sin(d.x - Math.PI / 2)})
    `);

    link.attr('d', d3.linkRadial()
        .angle(d => d.target.x)
        .radius(d => d.target.y));

    return { link, node };
}

function setupTreeLayout(data, g, width, height) {
    const hierarchy = createHierarchy(data);
    
    const tree = d3.tree()
        .size([height - 100, width - 200]);

    const root = tree(hierarchy);

    // Position nodes
    const nodes = root.descendants().map(d => ({
        ...d.data,
        x: d.y, // Swap x and y for horizontal layout
        y: d.x
    }));

    // Create links
    const links = root.links().map(d => ({
        source: d.source.data,
        target: d.target.data
    }));

    const { link, node } = renderBaseGraph({ nodes, links }, g);

    // Position nodes in tree layout
    node.attr('transform', d => `translate(${d.x},${d.y})`);

    link.attr('d', d3.linkHorizontal()
        .x(d => d.source.x)
        .y(d => d.source.y));

    return { link, node };
}

function setupCircleLayout(data, g, width, height) {
    const pack = d3.pack()
        .size([width - 100, height - 100])
        .padding(3);

    const hierarchy = d3.hierarchy({ children: data.nodes })
        .sum(d => 1)
        .sort((a, b) => b.value - a.value);

    const root = pack(hierarchy);

    // Position nodes
    const nodes = root.descendants().slice(1).map(d => ({
        ...d.data,
        x: d.x,
        y: d.y,
        r: d.r
    }));

    const { node } = renderBaseGraph({ nodes, links: [] }, g);

    // Position nodes in circle packing layout
    node.attr('transform', d => `translate(${d.x},${d.y})`);

    return { node };
}

// Helper functions
function createHierarchy(data) {
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
            const link = data.links.find(l => l.target === d.id || l.target.id === d.id);
            return link ? (link.source.id || link.source) : null;
        });

    return stratify(data.nodes)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name));
}

function renderBaseGraph(data, g) {
    // Create links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(data.links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);

    // Create nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .join('g');

    // Apply styling
    applyNodeStyling(node, g.node().parentNode.parentNode, d3, nodeColors, nodeSize);

    return { link, node };
}

function setupZoomControls(svg, g, zoom) {
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetZoom = document.getElementById('resetZoom');

    if (zoomIn) {
        zoomIn.onclick = () => {
            const currentTransform = d3.zoomTransform(svg.node());
            svg.transition()
                .duration(300)
                .call(zoom.transform, 
                    currentTransform.scale(currentTransform.k * 1.5)
                );
        };
    }

    if (zoomOut) {
        zoomOut.onclick = () => {
            const currentTransform = d3.zoomTransform(svg.node());
            svg.transition()
                .duration(300)
                .call(zoom.transform, 
                    currentTransform.scale(currentTransform.k / 1.5)
                );
        };
    }

    if (resetZoom) {
        resetZoom.onclick = () => {
            svg.transition()
                .duration(300)
                .call(zoom.transform, d3.zoomIdentity);
        };
    }
}

function clearGraph(g) {
    g.selectAll('*').remove();
}

function switchLayout(layoutName, data, g, width, height) {
    // Clear existing graph with transition
    g.selectAll('*')
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();

    // Apply new layout after transition
    setTimeout(() => {
        switch(layoutName) {
            case 'force':
                setupForceLayout(data, g, width, height);
                break;
            case 'radial':
                setupRadialLayout(data, g, width, height);
                break;
            case 'tree':
                setupTreeLayout(data, g, width, height);
                break;
            case 'circle':
                setupCircleLayout(data, g, width, height);
                break;
            default:
                setupForceLayout(data, g, width, height);
        }

        // Fade in new layout
        g.selectAll('*')
            .style('opacity', 0)
            .transition()
            .duration(300)
            .style('opacity', 1);
    }, 300);
}

// Update the refresh handler
document.getElementById('refreshBtn')?.addEventListener('click', () => {
    if (currentGraph) {
        currentGraph = switchLayout(currentLayout, data, g, width, height);
    }
});