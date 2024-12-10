import { render } from '@testing-library/react';
import { GraphLink } from '../GraphLink';
import { useTheme } from '@/contexts/ThemeContext';

vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('GraphLink', () => {
    const mockProps = {
        sourceX: 0,
        sourceY: 0,
        targetX: 100,
        targetY: 100,
    };

    beforeEach(() => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
    });

    it('renders link with correct coordinates', () => {
        const { container } = render(<svg><GraphLink {...mockProps} /></svg>);
        const line = container.querySelector('line');

        expect(line).toHaveAttribute('x1', '0');
        expect(line).toHaveAttribute('y1', '0');
        expect(line).toHaveAttribute('x2', '100');
        expect(line).toHaveAttribute('y2', '100');
    });

    it('uses correct color based on theme', () => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });

        const { container } = render(<svg><GraphLink {...mockProps} /></svg>);
        const line = container.querySelector('line');

        expect(line).toHaveAttribute('stroke', '#4B5563');
    });

    it('applies animation properties', () => {
        const { container } = render(<svg><GraphLink {...mockProps} /></svg>);
        const line = container.querySelector('line');

        expect(line).toHaveClass('pointer-events-none');
        expect(line).toHaveAttribute('stroke-width', '1');
    });
}); 