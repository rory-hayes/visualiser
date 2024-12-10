import * as d3 from 'd3';

export interface Node {
    id: string;
    title: string;
    type: 'page' | 'database';
    parentId: string | null;
}

export interface Link {
    source: string;
    target: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

export function createGraphData(nodes: Node[]): GraphData {
    // Create links based on parent-child relationships
    const links = nodes
        .filter(node => node.parentId)
        .map(node => ({
            source: node.parentId!,
            target: node.id,
        }));

    return { nodes, links };
}

export function createForceSimulation(
    data: GraphData,
    width: number,
    height: number
) {
    return d3.forceSimulation(data.nodes as any)
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50))
        .force(
            'link',
            d3.forceLink(data.links)
                .id((d: any) => d.id)
                .distance(100)
        );
}

export function createTreeLayout(
    data: GraphData,
    width: number,
    height: number
) {
    // Convert flat structure to hierarchical
    const stratify = d3.stratify<Node>()
        .id(d => d.id)
        .parentId(d => d.parentId);

    const root = stratify(data.nodes);

    return d3.tree<Node>()
        .size([width, height])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2))(root);
}

export function createRadialLayout(
    data: GraphData,
    width: number,
    height: number
) {
    const stratify = d3.stratify<Node>()
        .id(d => d.id)
        .parentId(d => d.parentId);

    const root = stratify(data.nodes);

    return d3.cluster<Node>()
        .size([2 * Math.PI, Math.min(width, height) / 2 - 100])(root);
}

export function getNodeColor(type: string, isDarkMode: boolean): string {
    if (type === 'page') {
        return isDarkMode ? '#3B82F6' : '#2563EB'; // blue
    }
    return isDarkMode ? '#10B981' : '#059669'; // green
}

export function getLinkColor(isDarkMode: boolean): string {
    return isDarkMode ? '#4B5563' : '#9CA3AF';
}

export function getTextColor(isDarkMode: boolean): string {
    return isDarkMode ? '#D1D5DB' : '#374151';
} 