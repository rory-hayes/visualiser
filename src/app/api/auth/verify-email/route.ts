import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/utils/auth';
import { captureException } from '@/utils/sentry';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            );
        }

        if (isTokenExpired(verificationToken.expires)) {
            return NextResponse.json(
                { error: 'Verification token has expired' },
                { status: 400 }
            );
        }

        // Update user and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { email: verificationToken.identifier },
                data: { emailVerified: new Date() }
            }),
            prisma.verificationToken.delete({
                where: { token }
            })
        ]);

        return NextResponse.json({
            message: 'Email verified successfully'
        });
    } catch (error) {
        captureException(error);
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        );
    }
} 