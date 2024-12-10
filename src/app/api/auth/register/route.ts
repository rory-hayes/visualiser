import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = schema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                settings: {
                    create: {
                        showLabels: true,
                        animateTransitions: true,
                        defaultLayout: 'force',
                        theme: 'system',
                        emailNotifications: true,
                        syncNotifications: true,
                        weeklyDigest: false,
                    },
                },
            },
        });

        logger.info({
            msg: 'User registered successfully',
            userId: user.id,
            email: user.email,
        });

        return NextResponse.json({
            message: 'Registration successful',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        logger.error('Registration failed:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
} 