import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotionClient } from '@/lib/notion';
import { captureException } from '@/utils/sentry';

export async function GET(
    request: Request,
    { params }: { params: { type: string; id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        if (params.type === 'page') {
            const content = await notionClient.getPageContent(params.id);
            return NextResponse.json(content);
        }

        if (params.type === 'database') {
            const content = await notionClient.getDatabaseContent(params.id);
            return NextResponse.json(content);
        }

        return NextResponse.json(
            { error: 'Invalid node type' },
            { status: 400 }
        );
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to fetch node content' },
            { status: 500 }
        );
    }
} 