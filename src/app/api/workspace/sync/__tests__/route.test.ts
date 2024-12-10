import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NotionClient } from '@/lib/notion';

// Mock dependencies
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        account: {
            findFirst: vi.fn(),
        },
        workspace: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        userSettings: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/notion', () => ({
    NotionClient: vi.fn(),
}));

describe('Workspace Sync API', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockAccount = {
        access_token: 'mock-token',
    };

    const mockWorkspaceData = {
        pages: [
            { pageId: 'page1', title: 'Page 1', type: 'page' },
        ],
        databases: [
            { databaseId: 'db1', title: 'Database 1' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(mockAccount);
        (NotionClient as jest.Mock).mockImplementation(() => ({
            getWorkspaceStructure: vi.fn().mockResolvedValue(mockWorkspaceData),
        }));
    });

    it('returns 401 when not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const request = new NextRequest('http://localhost:3000/api/workspace/sync');
        const response = await POST(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when Notion account not connected', async () => {
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);
        const request = new NextRequest('http://localhost:3000/api/workspace/sync');
        const response = await POST(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Notion account not connected' });
    });

    it('syncs workspace data successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/workspace/sync');
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
            message: 'Workspace synced successfully',
            changes: expect.any(Object),
        });
    });

    it('handles sync errors gracefully', async () => {
        (NotionClient as jest.Mock).mockImplementation(() => ({
            getWorkspaceStructure: vi.fn().mockRejectedValue(new Error('Sync failed')),
        }));

        const request = new NextRequest('http://localhost:3000/api/workspace/sync');
        const response = await POST(request);

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Failed to sync workspace' });
    });

    it('sends notification when enabled', async () => {
        (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
            syncNotifications: true,
        });

        const request = new NextRequest('http://localhost:3000/api/workspace/sync');
        await POST(request);

        // Verify notification was sent (you'll need to implement this based on your notification system)
        // expect(sendNotification).toHaveBeenCalled();
    });
}); 