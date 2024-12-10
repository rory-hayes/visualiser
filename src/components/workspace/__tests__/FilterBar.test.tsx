import { render, screen, fireEvent } from '@/test/utils';
import { FilterBar } from '../FilterBar';
import type { WorkspaceItem } from '@/types/workspace';

describe('FilterBar', () => {
    const mockItems: WorkspaceItem[] = [
        {
            id: '1',
            title: 'Test Page',
            type: 'page',
            parentId: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
    ];

    it('renders search and filter controls', () => {
        render(<FilterBar />, { initialItems: mockItems });

        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
    });

    it('updates filters when controls change', async () => {
        render(<FilterBar />, { initialItems: mockItems });

        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });

        const filterSelect = screen.getByLabelText(/filter/i);
        fireEvent.change(filterSelect, { target: { value: 'pages' } });

        await screen.findByText('Test Page');
    });
}); 