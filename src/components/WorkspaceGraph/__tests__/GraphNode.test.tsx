import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphNode } from '../GraphNode';
import { useTheme } from '@/contexts/ThemeContext';

vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('GraphNode', () => {
    const mockNode = {
        id: 'test-1',
        title: 'Test Node',
        type: 'page' as const,
        parentId: null,
    };

    const defaultProps = {
        node: mockNode,
        x: 100,
        y: 100,
        selected: false,
        showLabel: true,
        onClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
    });

    it('renders node with label', () => {
        render(<svg><GraphNode {...defaultProps} /></svg>);
        
        expect(screen.getByText('Test Node')).toBeInTheDocument();
        expect(screen.getByTestId('graph-node-test-1')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
        render(
            <svg>
                <GraphNode {...defaultProps} showLabel={false} />
            </svg>
        );
        
        expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
    });

    it('applies selected styles', () => {
        const { container } = render(
            <svg>
                <GraphNode {...defaultProps} selected={true} />
            </svg>
        );
        
        const circle = container.querySelector('circle');
        expect(circle).toHaveAttribute('r', '8');
        expect(circle).toHaveClass('stroke-2', 'stroke-current');
    });

    it('handles click events', () => {
        render(<svg><GraphNode {...defaultProps} /></svg>);
        
        fireEvent.click(screen.getByTestId('graph-node-test-1'));
        expect(defaultProps.onClick).toHaveBeenCalledWith(mockNode);
    });

    it('applies correct colors based on theme', () => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });
        
        const { container } = render(
            <svg>
                <GraphNode {...defaultProps} />
            </svg>
        );
        
        const circle = container.querySelector('circle');
        const text = container.querySelector('text');
        
        expect(circle).toHaveAttribute('fill', '#3B82F6'); // Dark mode page color
        expect(text).toHaveAttribute('fill', '#D1D5DB'); // Dark mode text color
    });

    it('applies hover animation', () => {
        render(<svg><GraphNode {...defaultProps} /></svg>);
        
        const node = screen.getByTestId('graph-node-test-1');
        expect(node).toHaveClass('cursor-pointer');
        // Note: Framer Motion animations would need to be tested with integration tests
    });
}); 