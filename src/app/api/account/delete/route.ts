import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/utils/sentry';

export async function DELETE() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete user and all related data
        await prisma.user.delete({
            where: {
                email: session.user.email,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
} 