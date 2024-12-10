import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceItem } from '../WorkspaceItem';
import type { WorkspaceItem as WorkspaceItemType } from '@/types/workspace';

describe('WorkspaceItem', () => {
    const mockItem: WorkspaceItemType = {
        id: '1',
        title: 'Test Item',
        type: 'page',
        parentId: null,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };

    it('renders item details correctly', () => {
        render(<WorkspaceItem item={mockItem} />);

        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText('page')).toBeInTheDocument();
        expect(screen.getByTestId('page-icon')).toHaveClass('text-blue-500');
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<WorkspaceItem item={mockItem} onClick={handleClick} />);

        fireEvent.click(screen.getByTestId(`workspace-item-${mockItem.id}`));
        expect(handleClick).toHaveBeenCalledWith(mockItem);
    });

    it('applies custom className', () => {
        render(<WorkspaceItem item={mockItem} className="custom-class" />);
        expect(screen.getByTestId(`workspace-item-${mockItem.id}`)).toHaveClass('custom-class');
    });
}); 