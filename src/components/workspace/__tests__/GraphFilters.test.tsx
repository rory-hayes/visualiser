import { render, screen, fireEvent } from '@testing-library/react';
import { GraphFilters } from '../GraphFilters';

describe('GraphFilters', () => {
    const defaultProps = {
        filter: 'all' as const,
        groupBy: 'none' as const,
        showOrphans: true,
        onFilterChange: vi.fn(),
        onGroupByChange: vi.fn(),
        onShowOrphansChange: vi.fn(),
    };

    it('renders all filter options', () => {
        render(<GraphFilters {...defaultProps} />);
        
        expect(screen.getByText('Show:')).toBeInTheDocument();
        expect(screen.getByText('Group by:')).toBeInTheDocument();
        expect(screen.getByText('Show orphans:')).toBeInTheDocument();
    });

    it('calls onFilterChange when filter is changed', () => {
        render(<GraphFilters {...defaultProps} />);
        
        const select = screen.getByText('All Items');
        fireEvent.click(select);
        
        const option = screen.getByText('Pages Only');
        fireEvent.click(option);
        
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith('page');
    });
}); 