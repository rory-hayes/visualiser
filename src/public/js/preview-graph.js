export function initializePreviewGraph() {
    const svg = d3.select('#preview-graph');
    const width = svg.node().parentElement.clientWidth;
    const height = svg.node().parentElement.clientHeight;

    // Sample data
    const nodes = [
        { id: "workspace", type: "workspace", name: "Workspace" },
        { id: "docs", type: "database", name: "Documents" },
        { id: "projects", type: "database", name: "Projects" },
        { id: "tasks", type: "database", name: "Tasks" },
        { id: "notes", type: "page", name: "Notes" },
        { id: "meetings", type: "page", name: "Meetings" },
        { id: "roadmap", type: "page", name: "Roadmap" },
        { id: "wiki", type: "page", name: "Wiki" },
    ];

    const links = [
        { source: "workspace", target: "docs" },
        { source: "workspace", target: "projects" },
        { source: "workspace", target: "tasks" },
        { source: "docs", target: "notes" },
        { source: "projects", target: "roadmap" },
        { source: "tasks", target: "meetings" },
        { source: "projects", target: "wiki" },
    ];

    // Color scale for node types
    const colorScale = d3.scaleOrdinal()
        .domain(["workspace", "database", "page"])
        .range(["#4F46E5", "#059669", "#2563EB"]);

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));

    // Create links
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", "#E5E7EB")
        .style("stroke-width", 2)
        .style("opacity", 0.6);

    // Create nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
        .attr("r", d => d.type === "workspace" ? 20 : 12)
        .style("fill", d => colorScale(d.type))
        .style("stroke", "#fff")
        .style("stroke-width", 2);

    // Add subtle animation
    function animate() {
        simulation.alpha(0.3).restart();
        setTimeout(() => {
            simulation.alpha(0).stop();
        }, 3000);
    }

    setInterval(animate, 8000);

    // Update positions
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
        const width = svg.node().parentElement.clientWidth;
        const height = svg.node().parentElement.clientHeight;
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    });
} 