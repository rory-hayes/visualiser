import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { sendEmail } from '@/utils/email';

const requestSchema = z.object({
    email: z.string().email(),
});

const resetSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = requestSchema.parse(body);

        // Generate reset token
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        // Send reset email
        await sendEmail({
            to: email,
            subject: 'Reset your password',
            html: `
                <p>Click the link below to reset your password:</p>
                <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}">
                    Reset Password
                </a>
                <p>This link will expire in 24 hours.</p>
            `,
        });

        logger.info({
            msg: 'Password reset requested',
            email,
        });

        return NextResponse.json({
            message: 'Password reset email sent',
        });
    } catch (error) {
        logger.error('Password reset request failed:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { token, password } = resetSchema.parse(body);

        // Verify token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        // Update password
        const hashedPassword = await hashPassword(password);
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { password: hashedPassword },
        });

        // Delete used token
        await prisma.verificationToken.delete({
            where: { token },
        });

        logger.info({
            msg: 'Password reset successful',
            email: verificationToken.identifier,
        });

        return NextResponse.json({
            message: 'Password reset successful',
        });
    } catch (error) {
        logger.error('Password reset failed:', error);
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        );
    }
} 