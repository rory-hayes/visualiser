import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardLayout } from '../DashboardLayout';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';

// Mock dependencies
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}));

describe('DashboardLayout', () => {
    const mockSession = {
        data: {
            user: {
                name: 'Test User',
                email: 'test@example.com',
                image: 'https://example.com/avatar.jpg',
            },
        },
    };

    beforeEach(() => {
        (useSession as jest.Mock).mockReturnValue(mockSession);
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light', setTheme: vi.fn() });
        (usePathname as jest.Mock).mockReturnValue('/dashboard');
    });

    it('renders navigation items', () => {
        render(<DashboardLayout>Content</DashboardLayout>);

        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Pages')).toBeInTheDocument();
        expect(screen.getByText('Databases')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard/pages');
        render(<DashboardLayout>Content</DashboardLayout>);

        const pagesLink = screen.getByText('Pages').closest('a');
        expect(pagesLink).toHaveClass('bg-gray-100');
    });

    it('renders user profile', () => {
        render(<DashboardLayout>Content</DashboardLayout>);

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('handles theme switching', () => {
        const setTheme = vi.fn();
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light', setTheme });

        render(<DashboardLayout>Content</DashboardLayout>);

        const themeSelect = screen.getByRole('combobox');
        fireEvent.change(themeSelect, { target: { value: 'dark' } });

        expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('handles mobile menu toggle', () => {
        render(<DashboardLayout>Content</DashboardLayout>);

        // Open mobile menu
        fireEvent.click(screen.getByLabelText('Open menu'));
        expect(screen.getByRole('dialog')).toHaveClass('translate-x-0');

        // Close mobile menu
        fireEvent.click(screen.getByLabelText('Close menu'));
        expect(screen.getByRole('dialog')).toHaveClass('-translate-x-full');
    });

    it('renders children content', () => {
        render(<DashboardLayout>Test Content</DashboardLayout>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('handles sign out', () => {
        const signOut = vi.fn();
        (useSession as jest.Mock).mockReturnValue({ ...mockSession, signOut });

        render(<DashboardLayout>Content</DashboardLayout>);
        fireEvent.click(screen.getByText('Sign out'));

        expect(signOut).toHaveBeenCalled();
    });
}); 