import { render, screen } from '@testing-library/react';
import { FilteredList } from '../FilteredList';
import { FilterProvider } from '@/contexts/FilterContext';
import type { WorkspaceItem } from '@/types/workspace';

describe('FilteredList', () => {
    const mockItems: WorkspaceItem[] = [
        {
            id: '1',
            title: 'Test Page',
            type: 'page',
            parentId: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
        {
            id: '2',
            title: 'Test Database',
            type: 'database',
            parentId: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
    ];

    it('renders list of items', () => {
        render(
            <FilterProvider initialItems={mockItems}>
                <FilteredList />
            </FilterProvider>
        );

        expect(screen.getByText('Test Page')).toBeInTheDocument();
        expect(screen.getByText('Test Database')).toBeInTheDocument();
    });

    it('shows empty state when no items match', () => {
        render(
            <FilterProvider initialItems={[]}>
                <FilteredList />
            </FilterProvider>
        );

        expect(screen.getByText(/No items match your filters/i)).toBeInTheDocument();
    });

    it('displays correct icons for different item types', () => {
        render(
            <FilterProvider initialItems={mockItems}>
                <FilteredList />
            </FilterProvider>
        );

        const pageIcon = screen.getByTestId('page-icon');
        const databaseIcon = screen.getByTestId('database-icon');

        expect(pageIcon).toHaveClass('text-blue-500');
        expect(databaseIcon).toHaveClass('text-green-500');
    });
}); 