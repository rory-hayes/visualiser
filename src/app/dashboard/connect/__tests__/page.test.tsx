import { render, screen, fireEvent } from '@testing-library/react';
import ConnectPage from '../page';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
}));

describe('ConnectPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { email: 'test@example.com' },
        });
    });

    it('renders connect page content', async () => {
        render(await ConnectPage());

        expect(screen.getByText('Connect your Notion account')).toBeInTheDocument();
        expect(screen.getByText('Connect with Notion')).toBeInTheDocument();
    });

    it('handles connect button click', async () => {
        render(await ConnectPage());
        
        fireEvent.click(screen.getByText('Connect with Notion'));
        
        expect(signIn).toHaveBeenCalledWith('notion', {
            callbackUrl: '/dashboard',
        });
    });

    it('shows connection benefits', async () => {
        render(await ConnectPage());

        expect(screen.getByText('Why connect?')).toBeInTheDocument();
        expect(screen.getByText(/Sync your Notion workspace/)).toBeInTheDocument();
        expect(screen.getByText(/Visualize your workspace structure/)).toBeInTheDocument();
    });

    it('redirects when already connected', async () => {
        const redirect = vi.fn();
        vi.mock('next/navigation', () => ({
            redirect,
        }));

        // Mock workspace exists
        vi.mock('@/lib/prisma', () => ({
            prisma: {
                workspace: {
                    findUnique: vi.fn().mockResolvedValue({ id: '1' }),
                },
            },
        }));

        await ConnectPage();
        expect(redirect).toHaveBeenCalledWith('/dashboard');
    });
}); 