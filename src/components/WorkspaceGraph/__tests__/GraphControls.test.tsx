import { render, screen, fireEvent } from '@testing-library/react';
import { GraphControls } from '../GraphControls';

describe('GraphControls', () => {
    const mockProps = {
        layout: 'force' as const,
        showLabels: true,
        onLayoutChange: vi.fn(),
        onToggleLabels: vi.fn(),
        onReset: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all controls', () => {
        render(<GraphControls {...mockProps} />);

        expect(screen.getByLabelText('Change layout')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle labels')).toBeInTheDocument();
        expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
    });

    it('handles layout change', () => {
        render(<GraphControls {...mockProps} />);

        const select = screen.getByLabelText('Change layout');
        fireEvent.change(select, { target: { value: 'tree' } });

        expect(mockProps.onLayoutChange).toHaveBeenCalledWith('tree');
    });

    it('handles label toggle', () => {
        render(<GraphControls {...mockProps} />);

        const toggle = screen.getByLabelText('Toggle labels');
        fireEvent.click(toggle);

        expect(mockProps.onToggleLabels).toHaveBeenCalled();
    });

    it('handles reset', () => {
        render(<GraphControls {...mockProps} />);

        const resetButton = screen.getByLabelText('Reset view');
        fireEvent.click(resetButton);

        expect(mockProps.onReset).toHaveBeenCalled();
    });

    it('reflects current state', () => {
        render(<GraphControls {...mockProps} layout="tree" showLabels={false} />);

        expect(screen.getByLabelText('Change layout')).toHaveValue('tree');
        expect(screen.getByLabelText('Toggle labels')).not.toBeChecked();
    });
}); 