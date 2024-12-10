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

        const settings = await prisma.userSettings.findUnique({
            where: { userEmail: session.user.email },
            select: {
                emailNotifications: true,
                syncNotifications: true,
                weeklyDigest: true,
            },
        });

        if (!settings) {
            return NextResponse.json({
                emailNotifications: true,
                syncNotifications: true,
                weeklyDigest: false,
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to fetch notification settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json();

        const settings = await prisma.userSettings.update({
            where: { userEmail: session.user.email },
            data: updates,
            select: {
                emailNotifications: true,
                syncNotifications: true,
                weeklyDigest: true,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to update notification settings' },
            { status: 500 }
        );
    }
} 