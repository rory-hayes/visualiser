document.getElementById("getStarted").addEventListener("click", () => {
    window.location.href = "/auth";
});

// Fetch and render the graph
async function renderGraph() {
    try {
        const response = await fetch("/callback"); // Adjust endpoint if needed
        const data = await response.json();

        const graph = data.graph;
        const score = data.score;

        // Display workspace score
        const scoreDiv = document.getElementById("workspaceScore");
        scoreDiv.innerHTML = `Workspace Score: ${score}`;

        // Setup SVG for D3
        const svg = d3.select("#visualization").append("svg")
            .attr("width", "100%")
            .attr("height", 500)
            .call(d3.zoom().on("zoom", function (event) {
                svg.attr("transform", event.transform);
            }))
            .append("g");

        // Render links
        svg.selectAll("line")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1.5);

        // Render nodes
        svg.selectAll("circle")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", (d) => d.type === "database" ? "#4CAF50" : "#2196F3")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        // Add labels
        svg.selectAll("text")
            .data(graph.nodes)
            .enter()
            .append("text")
            .text((d) => d.name)
            .attr("font-size", "12px")
            .attr("fill", "#333");
    } catch (error) {
        console.error("Error fetching or rendering graph:", error);
    }
}

// Load the graph when the page loads
window.onload = renderGraph;