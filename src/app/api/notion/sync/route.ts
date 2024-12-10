import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotionClient } from '@/lib/notion';
import { sendSyncNotification } from '@/utils/notifications';
import { captureException } from '@/utils/sentry';
import { event as analyticsEvent } from '@/utils/analytics';

export async function POST(request: Request) {
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
        const workspaceData = await notionClient.getWorkspaceStructure();

        // Track changes for notification
        const previousWorkspace = await prisma.workspace.findUnique({
            where: { userEmail: session.user.email },
            include: {
                pages: true,
                databases: true,
            }
        });

        // Store workspace data in database
        const updatedWorkspace = await prisma.workspace.upsert({
            where: {
                userEmail: session.user.email
            },
            update: {
                lastSynced: new Date(),
                data: workspaceData,
                pages: {
                    deleteMany: {},
                    createMany: {
                        data: workspaceData.pages.map((page: any) => ({
                            pageId: page.id,
                            title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
                            type: 'page',
                            parentId: page.parent?.type === 'database_id' 
                                ? page.parent.database_id 
                                : page.parent?.type === 'page_id'
                                ? page.parent.page_id
                                : null
                        }))
                    }
                },
                databases: {
                    deleteMany: {},
                    createMany: {
                        data: workspaceData.databases.map((db: any) => ({
                            databaseId: db.id,
                            title: db.title?.[0]?.plain_text || 'Untitled',
                            parentId: db.parent?.type === 'page_id' ? db.parent.page_id : null
                        }))
                    }
                }
            },
            create: {
                userEmail: session.user.email,
                lastSynced: new Date(),
                data: workspaceData,
                pages: {
                    createMany: {
                        data: workspaceData.pages.map((page: any) => ({
                            pageId: page.id,
                            title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
                            type: 'page',
                            parentId: page.parent?.type === 'database_id' 
                                ? page.parent.database_id 
                                : page.parent?.type === 'page_id'
                                ? page.parent.page_id
                                : null
                        }))
                    }
                },
                databases: {
                    createMany: {
                        data: workspaceData.databases.map((db: any) => ({
                            databaseId: db.id,
                            title: db.title?.[0]?.plain_text || 'Untitled',
                            parentId: db.parent?.type === 'page_id' ? db.parent.page_id : null
                        }))
                    }
                }
            },
            include: {
                pages: true,
                databases: true,
            }
        });

        // Calculate changes for notification
        const changes = {
            pages: {
                added: updatedWorkspace.pages.length - (previousWorkspace?.pages.length || 0),
                total: updatedWorkspace.pages.length
            },
            databases: {
                added: updatedWorkspace.databases.length - (previousWorkspace?.databases.length || 0),
                total: updatedWorkspace.databases.length
            }
        };

        // Send notification
        if (session.user.email) {
            await sendSyncNotification(session.user.email, changes);
        }

        analyticsEvent({
            action: 'workspace_sync',
            category: 'Workspace',
            label: session.user.email,
            value: workspaceData.pages.length + workspaceData.databases.length
        });

        return NextResponse.json({
            message: 'Workspace synced successfully',
            changes
        });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to sync workspace' },
            { status: 500 }
        );
    }
} 