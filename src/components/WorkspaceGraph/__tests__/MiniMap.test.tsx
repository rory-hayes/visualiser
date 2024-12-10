import { render, fireEvent } from '@testing-library/react';
import { MiniMap } from '../MiniMap';
import { useTheme } from '@/contexts/ThemeContext';

vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('MiniMap', () => {
    const mockProps = {
        nodes: [
            { id: '1', type: 'page', x: 0, y: 0, title: 'Node 1', parentId: null },
            { id: '2', type: 'database', x: 100, y: 100, title: 'Node 2', parentId: '1' },
        ],
        links: [
            {
                source: { id: '1', type: 'page', x: 0, y: 0, title: 'Node 1', parentId: null },
                target: { id: '2', type: 'database', x: 100, y: 100, title: 'Node 2', parentId: '1' },
            },
        ],
        width: 200,
        height: 150,
        viewBox: { x: 0, y: 0, width: 1000, height: 750 },
        onViewBoxChange: vi.fn(),
    };

    beforeEach(() => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
    });

    it('renders all nodes and links', () => {
        const { container } = render(<MiniMap {...mockProps} />);

        expect(container.querySelectorAll('circle')).toHaveLength(2);
        expect(container.querySelectorAll('line')).toHaveLength(1);
    });

    it('renders viewport rectangle', () => {
        const { container } = render(<MiniMap {...mockProps} />);
        const viewport = container.querySelector('rect');

        expect(viewport).toHaveAttribute('x', '0');
        expect(viewport).toHaveAttribute('y', '0');
        expect(viewport).toHaveAttribute('width', '1000');
        expect(viewport).toHaveAttribute('height', '750');
    });

    it('handles click events for viewport change', () => {
        const { container } = render(<MiniMap {...mockProps} />);
        const svg = container.querySelector('svg');

        fireEvent.click(svg!, {
            clientX: 100,
            clientY: 75,
            currentTarget: {
                getBoundingClientRect: () => ({
                    left: 0,
                    top: 0,
                    width: 200,
                    height: 150,
                }),
            },
        });

        expect(mockProps.onViewBoxChange).toHaveBeenCalled();
    });

    it('applies correct scaling', () => {
        const { container } = render(<MiniMap {...mockProps} />);
        const transform = container.querySelector('g')?.getAttribute('transform');

        expect(transform).toBe('scale(0.2)'); // 200/1000 = 0.2
    });
}); 