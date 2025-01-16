export function initializeWorkspaceGraph(container, workspaceData) {
    // Convert workspace data into graph format
    const { nodes, links } = processWorkspaceData(workspaceData);
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'workspace-graph');

    // Define color scale for different node types
    const colorScale = d3.scaleOrdinal()
        .domain(['page', 'text', 'to_do', 'toggle', 'header', 'callout'])
        .range(['#4F46E5', '#059669', '#DC2626', '#2563EB', '#7C3AED', '#EA580C']);

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => d.type === 'page' ? 100 : 50))
        .force("charge", d3.forceManyBody()
            .strength(d => d.type === 'page' ? -200 : -50))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide()
            .radius(d => d.type === 'page' ? 20 : 10));

    // Create links
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", "#E5E7EB")
        .style("stroke-width", d => d.source.type === 'page' && d.target.type === 'page' ? 2 : 1)
        .style("opacity", 0.6);

    // Create nodes
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
        .attr("r", d => d.type === 'page' ? 15 : 8)
        .style("fill", d => colorScale(d.type))
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .append("title")
        .text(d => `Type: ${d.type}\nDepth: ${d.depth}`);

    // Add type indicators
    node.append("text")
        .attr("dy", d => d.type === 'page' ? 25 : 15)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs fill-current text-gray-600")
        .text(d => d.type);

    // Update positions on each tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
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

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        svg
            .attr('width', width)
            .attr('height', height);
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    });

    return simulation;
}

function processWorkspaceData(data) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Process each row into nodes
    data.forEach(row => {
        if (!row.ID) return;

        // Create node if it doesn't exist
        if (!nodeMap.has(row.ID)) {
            const node = {
                id: row.ID,
                type: row.TYPE || 'unknown',
                depth: row.DEPTH || 0,
                pageDepth: row.PAGE_DEPTH || 0
            };
            nodes.push(node);
            nodeMap.set(row.ID, node);
        }

        // Create parent-child links
        if (row.PARENT_ID && nodeMap.has(row.PARENT_ID)) {
            links.push({
                source: row.PARENT_ID,
                target: row.ID
            });
        }

        // Process ancestors for additional connections
        if (row.ANCESTORS) {
            try {
                const ancestors = JSON.parse(row.ANCESTORS);
                for (let i = 0; i < ancestors.length - 1; i++) {
                    const source = ancestors[i];
                    const target = ancestors[i + 1];
                    if (source && target) {
                        links.push({
                            source: target,
                            target: source
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing ancestors:', error);
            }
        }
    });

    return { nodes, links };
}