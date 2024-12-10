import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';
import { addDays } from 'date-fns';

describe('Calendar', () => {
    it('renders calendar with default props', () => {
        render(<Calendar />);
        expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('handles date selection', () => {
        const onSelect = vi.fn();
        render(<Calendar mode="single" selected={new Date()} onSelect={onSelect} />);

        const today = screen.getByRole('button', { name: /today/i });
        fireEvent.click(today);

        expect(onSelect).toHaveBeenCalled();
    });

    it('handles date range selection', () => {
        const onSelect = vi.fn();
        const today = new Date();
        const nextWeek = addDays(today, 7);

        render(
            <Calendar
                mode="range"
                selected={{ from: today, to: nextWeek }}
                onSelect={onSelect}
            />
        );

        const startDate = screen.getByRole('button', { name: /today/i });
        fireEvent.click(startDate);

        const endDate = screen.getByRole('button', { name: new RegExp(nextWeek.getDate().toString()) });
        fireEvent.click(endDate);

        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
            from: expect.any(Date),
            to: expect.any(Date),
        }));
    });

    it('applies custom className', () => {
        render(<Calendar className="custom-class" />);
        expect(screen.getByRole('grid').parentElement).toHaveClass('custom-class');
    });
}); 