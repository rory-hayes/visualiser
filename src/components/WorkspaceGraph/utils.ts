import * as d3 from 'd3';
import { Node, Link } from '@/types/workspace';

export interface GraphConfig {
    width: number;
    height: number;
    nodeRadius: number;
    linkDistance: number;
    chargeStrength: number;
    centerStrength: number;
}

export const defaultConfig: GraphConfig = {
    width: 800,
    height: 600,
    nodeRadius: 8,
    linkDistance: 100,
    chargeStrength: -300,
    centerStrength: 0.1,
};

export function createSimulation(nodes: Node[], links: Link[], config: GraphConfig) {
    return d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(config.linkDistance))
        .force('charge', d3.forceManyBody().strength(config.chargeStrength))
        .force('center', d3.forceCenter(config.width / 2, config.height / 2))
        .force('collision', d3.forceCollide().radius(config.nodeRadius * 2));
}

export function getNodeColor(type: string): string {
    switch (type) {
        case 'workspace':
            return '#FF4081';
        case 'database':
            return '#4CAF50';
        case 'page':
            return '#2196F3';
        case 'teamspace':
            return '#FFC107';
        default:
            return '#9E9E9E';
    }
}

export function getLinkColor(type: string): string {
    switch (type) {
        case 'entry':
            return '#666';
        case 'contains':
            return '#999';
        default:
            return '#ccc';
    }
}

export function getLinkWidth(type: string): number {
    return type === 'entry' ? 2 : 1;
}

export function applyZoom(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
) {
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    return zoom;
} 