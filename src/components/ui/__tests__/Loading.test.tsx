import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';

describe('Loading', () => {
    it('renders with default message', () => {
        render(<Loading />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        render(<Loading message="Custom loading message" />);
        expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('renders in fullscreen mode', () => {
        render(<Loading fullScreen />);
        expect(screen.getByRole('status')).toHaveClass('fixed');
    });
}); 