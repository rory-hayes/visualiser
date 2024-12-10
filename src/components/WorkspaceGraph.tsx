'use client';

import * as React from 'react';
import * as d3 from 'd3';

interface Node {
    id: string;
    name: string;
    type: 'workspace' | 'database' | 'page' | 'teamspace';
}

interface Link {
    source: string;
    target: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

interface WorkspaceGraphProps {
    data: GraphData;
}

export function WorkspaceGraph({ data }: WorkspaceGraphProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);

    React.useEffect(() => {
        if (!svgRef.current || !data) return;

        const width = 800;
        const height = 600;

        // Clear existing SVG
        d3.select(svgRef.current).selectAll("*").remove();

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom as any);

        const g = svg.append('g');

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes as any)
            .force('link', d3.forceLink(data.links).id((d: any) => d.id))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Draw links
        const links = g.selectAll('line')
            .data(data.links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);

        // Draw nodes
        const nodes = g.selectAll('circle')
            .data(data.nodes)
            .enter()
            .append('circle')
            .attr('r', 8)
            .attr('fill', (d) => {
                switch (d.type) {
                    case 'workspace': return '#FF4081';
                    case 'database': return '#4CAF50';
                    case 'page': return '#2196F3';
                    case 'teamspace': return '#FFC107';
                    default: return '#9E9E9E';
                }
            })
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended) as any
            );

        // Add labels
        const labels = g.selectAll('text')
            .data(data.nodes)
            .enter()
            .append('text')
            .text((d) => d.name)
            .attr('font-size', '12px')
            .attr('dx', 12)
            .attr('dy', 4);

        // Update positions on simulation tick
        simulation.on('tick', () => {
            links
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            nodes
                .attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y);

            labels
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y);
        });

        // Drag functions
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return () => {
            simulation.stop();
        };
    }, [data]);

    return (
        <svg
            ref={svgRef}
            className="w-full h-[600px] bg-white rounded-lg shadow-lg"
        />
    );
} 