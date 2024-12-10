import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

const mockNodes = [
    { id: 'page1', title: 'Getting Started', type: 'page' },
    { id: 'page2', title: 'Project Overview', type: 'page' },
    { id: 'db1', title: 'Tasks Database', type: 'database' },
];

describe('SearchBar', () => {
    const onSelect = vi.fn();

    beforeEach(() => {
        onSelect.mockClear();
    });

    it('renders search input', () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        expect(screen.getByPlaceholderText('Search pages and databases...')).toBeInTheDocument();
    });

    it('filters nodes based on search input', async () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        const input = screen.getByRole('searchbox');

        fireEvent.change(input, { target: { value: 'Tasks' } });

        await waitFor(() => {
            expect(screen.getByText('Tasks Database')).toBeInTheDocument();
            expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
        });
    });

    it('shows "No results found" when no matches', async () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        const input = screen.getByRole('searchbox');

        fireEvent.change(input, { target: { value: 'nonexistent' } });

        await waitFor(() => {
            expect(screen.getByText('No results found')).toBeInTheDocument();
        });
    });

    it('calls onSelect when a node is clicked', async () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        const input = screen.getByRole('searchbox');

        fireEvent.change(input, { target: { value: 'Tasks' } });

        await waitFor(() => {
            fireEvent.click(screen.getByText('Tasks Database'));
        });

        expect(onSelect).toHaveBeenCalledWith(mockNodes[2]);
    });

    it('clears search input after selection', async () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        const input = screen.getByRole('searchbox');

        fireEvent.change(input, { target: { value: 'Tasks' } });
        await waitFor(() => {
            fireEvent.click(screen.getByText('Tasks Database'));
        });

        expect(input).toHaveValue('');
    });

    it('handles case-insensitive search', async () => {
        render(<SearchBar nodes={mockNodes} onSelect={onSelect} />);
        const input = screen.getByRole('searchbox');

        fireEvent.change(input, { target: { value: 'tasks' } });

        await waitFor(() => {
            expect(screen.getByText('Tasks Database')).toBeInTheDocument();
        });
    });
}); 