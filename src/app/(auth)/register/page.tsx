'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <Card.Header>
                    <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                        Create your account
                    </h1>
                </Card.Header>
                <Card.Body className="space-y-6">
                    <RegisterForm onSuccess={() => router.push('/login')} />

                    <div className="text-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                        </span>
                        <Link
                            href="/login"
                            className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                        >
                            Sign in
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </AuthLayout>
    );
} 