import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/utils/logger';

async function handler() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.NEXT_PUBLIC_VERSION || 'development',
            environment: process.env.NODE_ENV,
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export const GET = withLogging(handler); 