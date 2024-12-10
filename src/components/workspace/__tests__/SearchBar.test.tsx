import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { vi } from 'vitest';

describe('SearchBar', () => {
    const defaultProps = {
        value: '',
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders with initial value', () => {
        render(<SearchBar {...defaultProps} value="initial" />);
        expect(screen.getByTestId('search-input')).toHaveValue('initial');
    });

    it('debounces onChange calls', async () => {
        render(<SearchBar {...defaultProps} />);
        const input = screen.getByTestId('search-input');

        fireEvent.change(input, { target: { value: 'test' } });
        expect(defaultProps.onChange).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(defaultProps.onChange).toHaveBeenCalledWith('test');
    });

    it('updates local value immediately', () => {
        render(<SearchBar {...defaultProps} />);
        const input = screen.getByTestId('search-input');

        fireEvent.change(input, { target: { value: 'test' } });
        expect(input).toHaveValue('test');
    });

    it('applies custom className', () => {
        const { container } = render(<SearchBar {...defaultProps} className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
}); 