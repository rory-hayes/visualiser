import { createGraphData, getNodeColor, getLinkColor, getTextColor } from '../graphLayout';

describe('graphLayout utilities', () => {
    const mockNodes = [
        { id: '1', title: 'Root', type: 'page', parentId: null },
        { id: '2', title: 'Child', type: 'page', parentId: '1' },
        { id: '3', title: 'Database', type: 'database', parentId: '1' },
    ];

    describe('createGraphData', () => {
        it('creates correct links from nodes', () => {
            const { nodes, links } = createGraphData(mockNodes);

            expect(nodes).toEqual(mockNodes);
            expect(links).toHaveLength(2);
            expect(links).toContainEqual({ source: '1', target: '2' });
            expect(links).toContainEqual({ source: '1', target: '3' });
        });

        it('handles nodes without parents', () => {
            const nodesWithoutParents = [
                { id: '1', title: 'Root 1', type: 'page', parentId: null },
                { id: '2', title: 'Root 2', type: 'page', parentId: null },
            ];

            const { links } = createGraphData(nodesWithoutParents);
            expect(links).toHaveLength(0);
        });
    });

    describe('color utilities', () => {
        it('returns correct colors for light mode', () => {
            expect(getNodeColor('page', false)).toBe('#2563EB');
            expect(getNodeColor('database', false)).toBe('#059669');
            expect(getLinkColor(false)).toBe('#9CA3AF');
            expect(getTextColor(false)).toBe('#374151');
        });

        it('returns correct colors for dark mode', () => {
            expect(getNodeColor('page', true)).toBe('#3B82F6');
            expect(getNodeColor('database', true)).toBe('#10B981');
            expect(getLinkColor(true)).toBe('#4B5563');
            expect(getTextColor(true)).toBe('#D1D5DB');
        });
    });
}); 