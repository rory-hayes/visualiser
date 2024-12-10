import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('DashboardPage', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockWorkspace = {
        lastSynced: new Date(),
        _count: {
            pages: 5,
            databases: 2,
        },
        pages: [
            { id: '1', title: 'Page 1', type: 'page' },
        ],
        databases: [
            { id: '1', title: 'Database 1' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(mockWorkspace);
    });

    it('renders workspace overview', async () => {
        render(await DashboardPage());

        expect(screen.getByText('Workspace Overview')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Total pages
        expect(screen.getByText('2')).toBeInTheDocument(); // Total databases
    });

    it('renders workspace graph', async () => {
        render(await DashboardPage());

        expect(screen.getByText('Workspace Graph')).toBeInTheDocument();
        expect(screen.getByText('Page 1')).toBeInTheDocument();
        expect(screen.getByText('Database 1')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        await DashboardPage();

        expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to connect when no workspace', async () => {
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(null);
        await DashboardPage();

        expect(redirect).toHaveBeenCalledWith('/dashboard/connect');
    });
}); 