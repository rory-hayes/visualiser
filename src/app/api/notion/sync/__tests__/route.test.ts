import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { NotionClient } from '@/lib/notion';
import { getServerSession } from 'next-auth';

vi.mock('next-auth');
vi.mock('@/lib/notion');

describe('Workspace Sync API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when not authenticated', async () => {
        (getServerSession as any).mockResolvedValue(null);

        const response = await POST(new Request('http://localhost'));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when Notion account not connected', async () => {
        (getServerSession as any).mockResolvedValue({
            user: { email: 'test@example.com' }
        });

        (prisma.account.findFirst as any).mockResolvedValue(null);

        const response = await POST(new Request('http://localhost'));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Notion account not connected');
    });

    it('successfully syncs workspace data', async () => {
        const mockWorkspaceData = {
            pages: [{ id: '1', title: 'Test Page' }],
            databases: [{ id: '1', title: 'Test DB' }]
        };

        (getServerSession as any).mockResolvedValue({
            user: { email: 'test@example.com' }
        });

        (prisma.account.findFirst as any).mockResolvedValue({
            access_token: 'test-token'
        });

        (NotionClient.prototype.getWorkspaceStructure as any).mockResolvedValue(mockWorkspaceData);

        const response = await POST(new Request('http://localhost'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Workspace synced successfully');
        expect(prisma.workspace.upsert).toHaveBeenCalled();
    });
}); 