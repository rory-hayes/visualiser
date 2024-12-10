import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceGraph } from '../WorkspaceGraph';
import type { WorkspaceItem } from '@/types/workspace';

const mockItems: WorkspaceItem[] = [
    { id: '1', title: 'Root', type: 'page' as const },
    { id: '2', title: 'Child', type: 'database' as const, parentId: '1' },
];

describe('WorkspaceGraph', () => {
    it('renders without crashing', () => {
        render(<WorkspaceGraph items={mockItems} />);
    });

    it('handles node selection', async () => {
        const onNodeSelect = jest.fn();
        render(<WorkspaceGraph items={mockItems} onNodeSelect={onNodeSelect} />);
        
        // Wait for graph to render
        await new Promise(resolve => setTimeout(resolve, 0));
        const node = screen.getByText('Root');
        fireEvent.click(node);
        expect(onNodeSelect).toHaveBeenCalledWith(mockItems[0]);
    });
}); 