'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleIcon, NotionIcon } from '@/components/icons';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const error = searchParams.get('error');

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <Card.Header>
                    <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                        Sign in to Notion Graph
                    </h1>
                </Card.Header>
                <Card.Body className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/50 dark:text-red-400 rounded-md">
                            {error === 'OAuthSignin' && 'Error connecting to provider.'}
                            {error === 'OAuthCallback' && 'Error during authentication.'}
                            {error === 'Credentials' && 'Invalid credentials.'}
                            {error === 'Default' && 'Authentication error.'}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            onClick={() => signIn('google', { callbackUrl })}
                            className="w-full"
                            variant="outline"
                        >
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            Continue with Google
                        </Button>
                        <Button
                            onClick={() => signIn('notion', { callbackUrl })}
                            className="w-full"
                            variant="outline"
                        >
                            <NotionIcon className="w-5 h-5 mr-2" />
                            Continue with Notion
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-500 bg-white dark:bg-gray-800">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <LoginForm callbackUrl={callbackUrl} />
                </Card.Body>
            </Card>
        </AuthLayout>
    );
} 