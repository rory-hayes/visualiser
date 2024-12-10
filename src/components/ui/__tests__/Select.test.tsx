import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';
import { vi } from 'vitest';

describe('Select', () => {
    const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
    ];

    const defaultProps = {
        options,
        value: '',
        onChange: vi.fn(),
        'aria-label': 'Test Select',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with default placeholder', () => {
        render(<Select {...defaultProps} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
        render(<Select {...defaultProps} placeholder="Custom placeholder" />);
        expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('shows options when clicked', async () => {
        const user = userEvent.setup();
        render(<Select {...defaultProps} />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('calls onChange when option is selected', async () => {
        const user = userEvent.setup();
        render(<Select {...defaultProps} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText('Option 1'));

        expect(defaultProps.onChange).toHaveBeenCalledWith('option1');
    });

    it('displays selected value', () => {
        render(<Select {...defaultProps} value="option1" />);
        expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<Select {...defaultProps} className="custom-class" />);
        expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });
}); 