import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '../FilterPanel';
import { addDays } from 'date-fns';
import { FilterHistoryEntry } from '@/types/filters';

describe('FilterPanel', () => {
    const mockProps = {
        criteria: {
            type: 'all' as const,
            // ... other criteria
        },
        onCriteriaChange: vi.fn(),
        history: [],
        onHistoryRestore: vi.fn(),
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: false,
        canRedo: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all filter sections', () => {
        render(<FilterPanel {...mockProps} />);

        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Filter History')).toBeInTheDocument();
    });

    it('handles date range changes', async () => {
        const user = userEvent.setup();
        render(<FilterPanel {...mockProps} />);

        await user.click(screen.getByText('Pick a date range'));
        
        const today = screen.getByRole('button', { name: /today/i });
        await user.click(today);

        const nextWeek = screen.getByRole('button', { 
            name: new RegExp(addDays(new Date(), 7).getDate().toString())
        });
        await user.click(nextWeek);

        expect(mockProps.onCriteriaChange).toHaveBeenCalledWith(
            expect.objectContaining({
                dateRange: expect.any(Object),
            })
        );
    });

    it('handles status changes', async () => {
        const user = userEvent.setup();
        render(<FilterPanel {...mockProps} />);

        await user.click(screen.getByLabelText('Filter by status'));
        await user.click(screen.getByText('Active'));

        expect(mockProps.onCriteriaChange).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'active',
            })
        );
    });

    it('handles history restoration', async () => {
        const historyEntry: FilterHistoryEntry = {
            id: '1',
            timestamp: new Date(),
            criteria: { 
                type: 'all',
                status: 'active' as const 
            },
            search: '',
            sort: { type: 'name' as const, direction: 'asc' },
        };

        const user = userEvent.setup();
        render(
            <FilterPanel
                {...mockProps}
                history={[historyEntry]}
                canUndo={true}
            />
        );

        await user.click(screen.getByText('Restore'));
        expect(mockProps.onHistoryRestore).toHaveBeenCalledWith(historyEntry);
    });

    it('handles undo/redo', async () => {
        const user = userEvent.setup();
        render(
            <FilterPanel
                {...mockProps}
                canUndo={true}
                canRedo={true}
            />
        );

        await user.click(screen.getByLabelText('Undo'));
        expect(mockProps.onUndo).toHaveBeenCalled();

        await user.click(screen.getByLabelText('Redo'));
        expect(mockProps.onRedo).toHaveBeenCalled();
    });
}); 