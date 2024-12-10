import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotionClient } from '@/lib/notion';
import { captureException } from '@/utils/sentry';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Notion access token
        const account = await prisma.account.findFirst({
            where: {
                user: { email: session.user.email },
                provider: 'notion'
            }
        });

        if (!account?.access_token) {
            return NextResponse.json(
                { error: 'Notion account not connected' },
                { status: 401 }
            );
        }

        const notionClient = new NotionClient(account.access_token);
        const workspaceData = await notionClient.getWorkspaceStructure();

        // Transform data for graph visualization
        const nodes = [
            { id: 'workspace', name: 'Workspace', type: 'workspace' },
            ...workspaceData.databases.map((db: any) => ({
                id: db.id,
                name: db.title?.[0]?.plain_text || 'Untitled',
                type: 'database',
                properties: db.properties,
                parent: db.parent
            })),
            ...workspaceData.pages.map((page: any) => ({
                id: page.id,
                name: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
                type: 'page',
                parent: page.parent
            }))
        ];

        const links = [
            // Database connections
            ...workspaceData.databases.map((db: any) => ({
                source: db.parent?.type === 'page_id' ? db.parent.page_id : 'workspace',
                target: db.id,
                type: 'contains'
            })),
            // Page connections
            ...workspaceData.pages.map((page: any) => ({
                source: page.parent?.type === 'database_id' 
                    ? page.parent.database_id 
                    : page.parent?.type === 'page_id'
                    ? page.parent.page_id
                    : 'workspace',
                target: page.id,
                type: page.parent?.type === 'database_id' ? 'entry' : 'contains'
            }))
        ];

        return NextResponse.json({ nodes, links });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace data' },
            { status: 500 }
        );
    }
} 