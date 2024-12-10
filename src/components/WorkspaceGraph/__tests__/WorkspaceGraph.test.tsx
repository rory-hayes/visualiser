import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceGraph } from '../index';
import { useTheme } from '@/contexts/ThemeContext';

// Mock the theme hook
vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light' })),
}));

const mockData = {
    nodes: [
        {
            id: 'page1',
            title: 'Getting Started',
            type: 'page',
            parentId: null,
        },
        {
            id: 'page2',
            title: 'Project Overview',
            type: 'page',
            parentId: 'page1',
        },
        {
            id: 'db1',
            title: 'Tasks Database',
            type: 'database',
            parentId: 'page1',
        },
    ],
};

describe('WorkspaceGraph', () => {
    const onNodeClick = vi.fn();

    beforeEach(() => {
        onNodeClick.mockClear();
    });

    it('renders graph with nodes', () => {
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
        expect(screen.getByText('Project Overview')).toBeInTheDocument();
        expect(screen.getByText('Tasks Database')).toBeInTheDocument();
    });

    it('renders search bar', () => {
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        expect(screen.getByPlaceholderText('Search pages and databases...')).toBeInTheDocument();
    });

    it('renders zoom controls', () => {
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
        expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        expect(screen.getByText('Generating graph...')).toBeInTheDocument();
    });

    it('handles node click', async () => {
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        // Wait for graph to initialize
        await screen.findByText('Getting Started');
        
        // Simulate node click
        fireEvent.click(screen.getByText('Getting Started'));
        
        expect(onNodeClick).toHaveBeenCalledWith(mockData.nodes[0]);
    });

    it('updates colors based on theme', () => {
        (useTheme as jest.Mock).mockReturnValueOnce({ theme: 'dark' });
        
        render(<WorkspaceGraph data={mockData} onNodeClick={onNodeClick} />);
        
        // Check if dark theme colors are applied
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toHaveStyle({ background: 'transparent' });
    });
}); 