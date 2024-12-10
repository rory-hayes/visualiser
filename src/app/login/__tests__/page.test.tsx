import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { toast } from 'sonner';

vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

describe('LoginPage', () => {
    const mockRouter = {
        push: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('renders login form', () => {
        render(<LoginPage />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: null });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('handles login error', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpassword' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        });
    });

    it('handles Google sign in', () => {
        render(<LoginPage />);

        fireEvent.click(screen.getByRole('button', { name: /google/i }));

        expect(signIn).toHaveBeenCalledWith('google');
    });
}); 