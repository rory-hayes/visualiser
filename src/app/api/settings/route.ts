import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const settingsSchema = z.object({
    showLabels: z.boolean().optional(),
    animateTransitions: z.boolean().optional(),
    defaultLayout: z.enum(['force', 'tree', 'radial']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
});

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.userSettings.findUnique({
            where: { userEmail: session.user.email },
        });

        return NextResponse.json(settings);
    } catch (error) {
        logger.error('Failed to fetch settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
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

        const body = await request.json();
        const validatedData = settingsSchema.parse(body);

        const settings = await prisma.userSettings.update({
            where: { userEmail: session.user.email },
            data: validatedData,
        });

        logger.info('Settings updated', {
            user: session.user.email,
            updates: validatedData,
        });

        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        logger.error('Failed to update settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
} 