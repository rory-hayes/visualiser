export function generateGraph(container, data) {
    // Add error checking at the start
    if (!window.d3) {
        console.error('D3 not found! Make sure d3 is loaded before calling generateGraph');
        return null;
    }

    // Use the globally available d3 object
    const d3Instance = window.d3;
    
    // Validate input parameters
    if (!container || !data) {
        console.error('Container or data is missing:', { hasContainer: !!container, hasData: !!data });
        return null;
    }

    // Log initialization
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

    // Create the SVG container
    const svg = d3Instance.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom functionality
    const g = svg.append('g');
    svg.call(d3Instance.zoom()
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

    const layouts = {
        force: setupForceLayout,
        radial: setupRadialLayout,
        tree: setupTreeLayout,
        disjoint: setupDisjointLayout,
        circle: setupCircleLayout
    };

    let currentLayout = 'force';
    let simulation = null;

    function setupForceLayout() {
        // Current force-directed implementation
        simulation = d3Instance.forceSimulation(data.nodes)
            .force('link', d3Instance.forceLink(data.links).id(d => d.id).distance(100))
            .force('charge', d3Instance.forceManyBody().strength(-400))
            .force('center', d3Instance.forceCenter(width / 2, height / 2))
            .force('collision', d3Instance.forceCollide().radius(50));
        
        return simulation;
    }

    function setupRadialLayout() {
        const root = d3Instance.stratify()
            .id(d => d.id)
            .parentId(d => findParentId(d, data.links))(data.nodes);

        const treeLayout = d3Instance.tree()
            .size([2 * Math.PI, Math.min(width, height) / 2 - 100])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

        return treeLayout(root);
    }

    function setupTreeLayout() {
        const root = d3Instance.stratify()
            .id(d => d.id)
            .parentId(d => findParentId(d, data.links))(data.nodes);

        const treeLayout = d3Instance.tree()
            .size([width - 100, height - 100]);

        return treeLayout(root);
    }

    function setupDisjointLayout() {
        const groups = groupNodesByParent(data.nodes, data.links);
        return d3Instance.forceSimulation(data.nodes)
            .force('link', d3Instance.forceLink(data.links).id(d => d.id).distance(50))
            .force('charge', d3Instance.forceManyBody().strength(-100))
            .force('x', d3Instance.forceX(d => groups[d.group] * width / (Object.keys(groups).length + 1)))
            .force('y', d3Instance.forceY(height / 2))
            .force('collision', d3Instance.forceCollide().radius(30));
    }

    function setupCircleLayout() {
        const root = d3Instance.hierarchy({ children: data.nodes })
            .sum(d => 1)
            .sort((a, b) => b.value - a.value);

        const pack = d3Instance.pack()
            .size([width - 100, height - 100])
            .padding(3);

        return pack(root);
    }

    function findParentId(node, links) {
        const link = links.find(l => l.target === node.id);
        return link ? link.source : null;
    }

    function groupNodesByParent(nodes, links) {
        const groups = {};
        nodes.forEach(node => {
            const parentLink = links.find(l => l.target === node.id);
            groups[node.id] = parentLink ? parentLink.source : 'root';
        });
        return groups;
    }

    function updateLayout(layoutName) {
        // Clear previous layout
        g.selectAll('*').remove();

        currentLayout = layoutName;
        const layout = layouts[layoutName]();

        // Render based on layout type
        if (layoutName === 'force') {
            renderForceLayout(layout);
        } else if (layoutName === 'radial') {
            renderRadialLayout(layout);
        } else if (layoutName === 'tree') {
            renderTreeLayout(layout);
        } else if (layoutName === 'disjoint') {
            renderDisjointLayout(layout);
        } else if (layoutName === 'circle') {
            renderCircleLayout(layout);
        }
    }

    // Add layout change listener
    const layoutSelect = document.getElementById('layoutSelect');
    layoutSelect.addEventListener('change', (e) => {
        updateLayout(e.target.value);
    });

    // Initial layout
    updateLayout('force');

    return {
        update: (newData) => {
            data = newData;
            updateLayout(currentLayout);
        }
    };
}

function renderForceLayout(simulation) {
    // Current rendering code
}

function renderRadialLayout(root) {
    const links = g.append('g')
        .selectAll('line')
        .data(root.links())
        .join('path')
        .attr('d', d3Instance.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const nodes = g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `
            translate(${d.y * Math.cos(d.x - Math.PI / 2)},
                     ${d.y * Math.sin(d.x - Math.PI / 2)})
        `);

    // Add circles and labels
    nodes.append('circle')
        .attr('r', d => nodeSize[d.data.type] || 10)
        .attr('fill', d => nodeColors[d.data.type] || '#999');

    nodes.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => d.x < Math.PI ? 6 : -6)
        .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
        .text(d => d.data.name)
        .clone(true).lower()
        .attr('stroke', 'white');
}

// ... Implement other rendering functions similarly