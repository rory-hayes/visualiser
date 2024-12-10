import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/utils/sentry';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { userEmail: session.user.email },
            include: {
                pages: true,
                databases: true,
            }
        });

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Calculate property usage statistics
        const propertyUsage = new Map<string, number>();
        workspace.data.databases.forEach((db: any) => {
            Object.entries(db.properties || {}).forEach(([key, value]: [string, any]) => {
                propertyUsage.set(
                    value.type,
                    (propertyUsage.get(value.type) || 0) + 1
                );
            });
        });

        const mostUsedProperties = Array.from(propertyUsage.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Get recent activity
        const recentPages = await prisma.page.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        const recentDatabases = await prisma.database.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        const recentActivity = [...recentPages, ...recentDatabases]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10)
            .map(item => ({
                id: item.id,
                name: item.title,
                type: 'pageId' in item ? 'page' : 'database',
                action: item.createdAt.getTime() === item.updatedAt.getTime() ? 'created' : 'updated',
                date: item.updatedAt,
            }));

        return NextResponse.json({
            totalPages: workspace.pages.length,
            totalDatabases: workspace.databases.length,
            mostUsedProperties,
            recentActivity,
            lastSynced: workspace.lastSynced,
        });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
} 