'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setError('Invalid verification link');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    async function verifyEmail(token: string) {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            setStatus('success');
        } catch (error) {
            setStatus('error');
            setError(error instanceof Error ? error.message : 'Failed to verify email');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="max-w-md w-full">
                <Card.Body className="text-center">
                    {status === 'loading' && (
                        <Loading text="Verifying your email..." />
                    )}

                    {status === 'success' && (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Email Verified!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your email has been successfully verified. You can now log in to your account.
                            </p>
                            <Button onClick={() => router.push('/login')}>
                                Go to Login
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                                Verification Failed
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {error}
                            </p>
                            <Button onClick={() => router.push('/login')}>
                                Back to Login
                            </Button>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
} 