import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterControls } from '../FilterControls';
import { vi } from 'vitest';

describe('FilterControls', () => {
    const defaultProps = {
        filter: 'all' as const,
        sort: { type: 'name' as const, direction: 'asc' as const },
        onFilterChange: vi.fn(),
        onSortChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders filter and sort controls', () => {
        render(<FilterControls {...defaultProps} />);
        expect(screen.getByLabelText('Filter items')).toBeInTheDocument();
        expect(screen.getByLabelText('Sort items')).toBeInTheDocument();
    });

    it('calls onFilterChange when filter is changed', async () => {
        const user = userEvent.setup();
        render(<FilterControls {...defaultProps} />);

        await user.click(screen.getByLabelText('Filter items'));
        await user.click(screen.getByText('Pages Only'));

        expect(defaultProps.onFilterChange).toHaveBeenCalledWith('pages');
    });

    it('calls onSortChange when sort is changed', async () => {
        const user = userEvent.setup();
        render(<FilterControls {...defaultProps} />);

        await user.click(screen.getByLabelText('Sort items'));
        await user.click(screen.getByText('Recently Updated'));

        expect(defaultProps.onSortChange).toHaveBeenCalledWith({
            type: 'updated',
            direction: 'desc',
        });
    });

    it('applies custom className', () => {
        const { container } = render(
            <FilterControls {...defaultProps} className="custom-class" />
        );
        expect(container.firstChild).toHaveClass('custom-class');
    });
}); 