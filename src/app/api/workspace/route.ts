import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get URL parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const filter = searchParams.get('filter');
        const sort = searchParams.get('sort');

        // Build query
        const where = {
            userEmail: session.user.email,
            ...(search && {
                OR: [
                    { pages: { some: { title: { contains: search, mode: 'insensitive' } } } },
                    { databases: { some: { title: { contains: search, mode: 'insensitive' } } } },
                ],
            }),
            ...(filter === 'root' && {
                OR: [
                    { pages: { some: { parentId: null } } },
                    { databases: { some: { parentId: null } } },
                ],
            }),
        };

        // Get workspace with filtered content
        const workspace = await prisma.workspace.findUnique({
            where: { userEmail: session.user.email },
            include: {
                pages: {
                    orderBy: sort === 'title-asc' 
                        ? { title: 'asc' }
                        : sort === 'title-desc'
                        ? { title: 'desc' }
                        : { updatedAt: 'desc' },
                },
                databases: {
                    orderBy: sort === 'title-asc'
                        ? { title: 'asc' }
                        : sort === 'title-desc'
                        ? { title: 'desc' }
                        : { updatedAt: 'desc' },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        logger.error('Failed to fetch workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
} 