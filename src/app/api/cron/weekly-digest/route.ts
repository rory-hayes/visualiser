import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyDigest } from '@/utils/notifications';
import { captureException } from '@/utils/sentry';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Verify cron secret to ensure this is called by the scheduler
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all users with weekly digest enabled
        const users = await prisma.user.findMany({
            where: {
                settings: {
                    weeklyDigest: true
                }
            },
            select: {
                email: true
            }
        });

        // Send digests in parallel
        await Promise.all(
            users.map(user => {
                if (user.email) {
                    return sendWeeklyDigest(user.email).catch(error => {
                        captureException(error, {
                            context: 'weeklyDigest.send',
                            extra: { email: user.email }
                        });
                    });
                }
            })
        );

        return NextResponse.json({
            message: `Weekly digests sent to ${users.length} users`
        });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to process weekly digests' },
            { status: 500 }
        );
    }
} 