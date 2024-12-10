import { sendEmail } from '@/utils/email';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/utils/sentry';

interface NotificationOptions {
    subject: string;
    template: string;
    data: Record<string, any>;
}

export async function sendNotification(userEmail: string, options: NotificationOptions) {
    try {
        const settings = await prisma.userSettings.findUnique({
            where: { userEmail },
            select: { emailNotifications: true }
        });

        if (!settings?.emailNotifications) {
            return;
        }

        await sendEmail({
            to: userEmail,
            subject: options.subject,
            html: renderTemplate(options.template, options.data)
        });
    } catch (error) {
        captureException(error, {
            context: 'notifications.send',
            extra: { userEmail, options }
        });
    }
}

export async function sendSyncNotification(userEmail: string, syncResult: any) {
    const settings = await prisma.userSettings.findUnique({
        where: { userEmail },
        select: { syncNotifications: true }
    });

    if (!settings?.syncNotifications) {
        return;
    }

    await sendNotification(userEmail, {
        subject: 'Workspace Sync Complete',
        template: 'sync-complete',
        data: {
            changes: syncResult,
            timestamp: new Date().toISOString()
        }
    });
}

export async function sendWeeklyDigest(userEmail: string) {
    const settings = await prisma.userSettings.findUnique({
        where: { userEmail },
        select: { weeklyDigest: true }
    });

    if (!settings?.weeklyDigest) {
        return;
    }

    const workspace = await prisma.workspace.findUnique({
        where: { userEmail },
        include: {
            pages: {
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            databases: {
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }
        }
    });

    await sendNotification(userEmail, {
        subject: 'Your Weekly Workspace Digest',
        template: 'weekly-digest',
        data: {
            updatedPages: workspace?.pages || [],
            updatedDatabases: workspace?.databases || [],
            timestamp: new Date().toISOString()
        }
    });
}

function renderTemplate(template: string, data: Record<string, any>): string {
    // Simple template rendering - in production, use a proper template engine
    const templates: Record<string, (data: any) => string> = {
        'sync-complete': (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Workspace Sync Complete</h1>
                <p>Your Notion workspace has been successfully synchronized.</p>
                <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
                ${data.changes ? `<p>Changes: ${JSON.stringify(data.changes, null, 2)}</p>` : ''}
            </div>
        `,
        'weekly-digest': (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Your Weekly Workspace Digest</h1>
                <p>Here's what changed in your workspace this week:</p>
                
                <h2>Updated Pages (${data.updatedPages.length})</h2>
                <ul>
                    ${data.updatedPages.map((page: any) => `
                        <li>${page.title} - ${new Date(page.updatedAt).toLocaleDateString()}</li>
                    `).join('')}
                </ul>

                <h2>Updated Databases (${data.updatedDatabases.length})</h2>
                <ul>
                    ${data.updatedDatabases.map((db: any) => `
                        <li>${db.title} - ${new Date(db.updatedAt).toLocaleDateString()}</li>
                    `).join('')}
                </ul>
            </div>
        `,
    };

    return templates[template]?.(data) || '';
} 