import { render, screen } from '@testing-library/react';
import DatabasesPage from '../page';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

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

describe('DatabasesPage', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockWorkspace = {
        databases: [
            {
                id: '1',
                databaseId: 'db1',
                title: 'Tasks',
                parentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '2',
                databaseId: 'db2',
                title: 'Projects',
                parentId: 'db1',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(mockWorkspace);
    });

    it('renders databases list', async () => {
        render(await DatabasesPage());

        expect(screen.getByText('Databases')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders empty state when no databases', async () => {
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
            databases: [],
        });

        render(await DatabasesPage());

        expect(screen.getByText('No databases')).toBeInTheDocument();
        expect(screen.getByText("Your Notion workspace doesn't have any databases yet.")).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        await DatabasesPage();

        expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to connect when no workspace', async () => {
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(null);
        await DatabasesPage();

        expect(redirect).toHaveBeenCalledWith('/dashboard/connect');
    });

    it('renders filter and sort controls', async () => {
        render(await DatabasesPage());

        expect(screen.getByPlaceholderText('Filter by...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Sort by...')).toBeInTheDocument();
    });
}); 