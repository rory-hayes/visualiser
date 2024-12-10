import { render, screen, fireEvent } from '@testing-library/react';
import WorkspacePage from '../page';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

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

vi.mock('@/hooks/useWorkspaceSync', () => ({
    useWorkspaceSync: vi.fn(),
}));

describe('WorkspacePage', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockWorkspace = {
        lastSynced: new Date(),
        pages: [
            { id: '1', title: 'Root Page', parentId: null },
            { id: '2', title: 'Child Page', parentId: '1' },
        ],
        databases: [
            { id: '1', title: 'Root Database', parentId: null },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(mockWorkspace);
        (useWorkspaceSync as jest.Mock).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
    });

    it('renders workspace structure', async () => {
        render(await WorkspacePage());

        expect(screen.getByText('Workspace Structure')).toBeInTheDocument();
        expect(screen.getByText('Root Page')).toBeInTheDocument();
        expect(screen.getByText('Child Page')).toBeInTheDocument();
        expect(screen.getByText('Root Database')).toBeInTheDocument();
    });

    it('handles sync button click', async () => {
        const syncMock = vi.fn();
        (useWorkspaceSync as jest.Mock).mockReturnValue({
            mutate: syncMock,
            isPending: false,
        });

        render(await WorkspacePage());
        fireEvent.click(screen.getByText('Sync Now'));

        expect(syncMock).toHaveBeenCalled();
    });

    it('shows loading state during sync', async () => {
        (useWorkspaceSync as jest.Mock).mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        });

        render(await WorkspacePage());
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('renders empty state when no content', async () => {
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
            pages: [],
            databases: [],
            lastSynced: new Date(),
        });

        render(await WorkspacePage());
        expect(screen.getByText('No content yet')).toBeInTheDocument();
    });

    it('shows last synced time', async () => {
        const lastSynced = new Date();
        (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
            ...mockWorkspace,
            lastSynced,
        });

        render(await WorkspacePage());
        expect(screen.getByText(/Last synced/)).toBeInTheDocument();
    });

    it('renders search functionality', async () => {
        render(await WorkspacePage());
        
        const searchInput = screen.getByPlaceholderText('Search workspace...');
        fireEvent.change(searchInput, { target: { value: 'Child' } });

        expect(screen.getByText('Child Page')).toBeInTheDocument();
        expect(screen.queryByText('Root Page')).not.toBeInTheDocument();
    });

    it('handles filter changes', async () => {
        render(await WorkspacePage());
        
        const filterSelect = screen.getByLabelText('Filter by');
        fireEvent.change(filterSelect, { target: { value: 'root' } });

        expect(screen.getByText('Root Page')).toBeInTheDocument();
        expect(screen.queryByText('Child Page')).not.toBeInTheDocument();
    });
}); 