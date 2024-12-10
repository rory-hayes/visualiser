import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock NextAuth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('Workspace API', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockWorkspace = {
        id: '1',
        userEmail: 'test@example.com',
        lastSynced: new Date(),
        pages: [
            { id: '1', title: 'Page 1', type: 'page' },
        ],
        databases: [
            { id: '1', title: 'Database 1', type: 'database' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    });

    describe('GET', () => {
        it('returns 401 when not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            const request = new NextRequest('http://localhost:3000/api/workspace');
            const response = await GET(request);

            expect(response.status).toBe(401);
            expect(await response.json()).toEqual({ error: 'Unauthorized' });
        });

        it('returns workspace data when authenticated', async () => {
            (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(mockWorkspace);
            const request = new NextRequest('http://localhost:3000/api/workspace');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(mockWorkspace);
        });

        it('handles search parameter', async () => {
            const request = new NextRequest('http://localhost:3000/api/workspace?search=test');
            await GET(request);

            expect(prisma.workspace.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userEmail: 'test@example.com',
                    }),
                })
            );
        });

        it('handles filter parameter', async () => {
            const request = new NextRequest('http://localhost:3000/api/workspace?filter=root');
            await GET(request);

            expect(prisma.workspace.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userEmail: 'test@example.com',
                    }),
                })
            );
        });
    });

    describe('POST', () => {
        it('returns 401 when not authenticated', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            const request = new NextRequest('http://localhost:3000/api/workspace');
            const response = await POST(request);

            expect(response.status).toBe(401);
            expect(await response.json()).toEqual({ error: 'Unauthorized' });
        });

        it('updates workspace data', async () => {
            const request = new NextRequest('http://localhost:3000/api/workspace', {
                method: 'POST',
                body: JSON.stringify({ data: { title: 'Updated Title' } }),
            });

            (prisma.workspace.update as jest.Mock).mockResolvedValue({ ...mockWorkspace, title: 'Updated Title' });
            const response = await POST(request);

            expect(response.status).toBe(200);
            expect(await response.json()).toMatchObject({ title: 'Updated Title' });
        });
    });
}); 