import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceGraph } from '../index';
import { useTheme } from '@/contexts/ThemeContext';

vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('WorkspaceGraph', () => {
    const mockData = {
        nodes: [
            { id: '1', title: 'Root', type: 'page', parentId: null },
            { id: '2', title: 'Child', type: 'page', parentId: '1' },
            { id: '3', title: 'Database', type: 'database', parentId: '1' },
        ],
    };

    beforeEach(() => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
        // Mock getBoundingClientRect for SVG dimensions
        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 1000,
            height: 800,
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            right: 1000,
            bottom: 800,
        }));
    });

    it('renders all nodes', () => {
        render(<WorkspaceGraph data={mockData} />);

        expect(screen.getByText('Root')).toBeInTheDocument();
        expect(screen.getByText('Child')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
    });

    it('handles node click', () => {
        const onNodeClick = vi.fn();
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);

        fireEvent.click(screen.getByText('Root'));
        expect(onNodeClick).toHaveBeenCalledWith(mockData.nodes[0]);
    });

    it('updates on theme change', () => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });
        render(<WorkspaceGraph data={mockData} />);

        // Verify dark theme styles are applied
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toHaveStyle({ background: 'transparent' });
    });
}); 