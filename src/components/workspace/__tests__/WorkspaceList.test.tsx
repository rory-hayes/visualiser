import { render, screen } from '@testing-library/react';
import { WorkspaceList } from '../WorkspaceList';
import type { WorkspaceItem } from '@/types/workspace';

describe('WorkspaceList', () => {
    const mockItems: WorkspaceItem[] = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        title: `Item ${i}`,
        type: i % 2 === 0 ? 'page' : 'database',
        parentId: i > 0 ? '0' : null,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    }));

    it('renders all items', () => {
        render(<WorkspaceList items={mockItems} />);
        expect(screen.getAllByTestId(/workspace-item-/)).toHaveLength(mockItems.length);
    });

    it('shows empty state when no items', () => {
        render(<WorkspaceList items={[]} />);
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<WorkspaceList items={mockItems} className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
}); 