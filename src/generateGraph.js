import { D3Node } from 'd3-node';

export function generateGraph({ nodes, links }) {
    const d3n = new D3Node();
    const d3 = d3n.d3;

    const width = 1200;
    const height = 800;

    const svg = d3n.createSVG(width, height);

    // Create force simulation
    const simulation = d3
        .forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d) => d.id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    // Render links
    svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5);

    // Render nodes
    svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

    // Tooltip
    svg.append('title').text((d) => `${d.name} (${d.type})`);

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

    return d3n.svgString();
}