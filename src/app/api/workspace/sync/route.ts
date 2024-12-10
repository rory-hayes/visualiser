import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotionClient } from '@/lib/notion';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Notion access token
        const account = await prisma.account.findFirst({
            where: {
                user: { email: session.user.email },
                provider: 'notion',
            },
            select: {
                access_token: true,
                expires_at: true,
                refresh_token: true,
            },
        });

        if (!account?.access_token) {
            return NextResponse.json(
                { error: 'Notion account not connected' },
                { status: 401 }
            );
        }

        // Check token expiration and refresh if needed
        if (account.expires_at && account.expires_at * 1000 < Date.now()) {
            if (!account.refresh_token) {
                return NextResponse.json(
                    { error: 'Notion token expired' },
                    { status: 401 }
                );
            }
            // Implement token refresh logic here
        }

        // Initialize Notion client and fetch workspace data
        const notion = new NotionClient(account.access_token);
        const workspaceData = await notion.getWorkspaceStructure();

        // Get current workspace state for change tracking
        const currentWorkspace = await prisma.workspace.findUnique({
            where: { userEmail: session.user.email },
            include: {
                pages: true,
                databases: true,
            },
        });

        // Update workspace data
        const updatedWorkspace = await prisma.workspace.upsert({
            where: { userEmail: session.user.email },
            create: {
                userEmail: session.user.email,
                lastSynced: new Date(),
                pages: { create: workspaceData.pages },
                databases: { create: workspaceData.databases },
            },
            update: {
                lastSynced: new Date(),
                pages: {
                    deleteMany: {},
                    create: workspaceData.pages,
                },
                databases: {
                    deleteMany: {},
                    create: workspaceData.databases,
                },
            },
            include: {
                pages: true,
                databases: true,
            },
        });

        // Calculate changes
        const changes = {
            pages: {
                added: updatedWorkspace.pages.length - (currentWorkspace?.pages.length || 0),
                total: updatedWorkspace.pages.length,
            },
            databases: {
                added: updatedWorkspace.databases.length - (currentWorkspace?.databases.length || 0),
                total: updatedWorkspace.databases.length,
            },
        };

        logger.info('Workspace synced successfully', {
            user: session.user.email,
            changes,
        });

        return NextResponse.json({
            message: 'Workspace synced successfully',
            changes,
        });
    } catch (error) {
        logger.error('Workspace sync failed:', error);
        return NextResponse.json(
            { error: 'Failed to sync workspace' },
            { status: 500 }
        );
    }
} 