'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { event as analyticsEvent } from '@/utils/analytics';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    if (!token) {
        return (
            <RequestResetPassword />
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            analyticsEvent({
                action: 'password_reset_success',
                category: 'Authentication'
            });

            setSuccess(true);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to reset password');
            analyticsEvent({
                action: 'password_reset_error',
                category: 'Authentication',
                label: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="max-w-md w-full">
                <Card.Body>
                    {success ? (
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Password Reset Successfully
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your password has been reset. You can now log in with your new password.
                            </p>
                            <Button onClick={() => router.push('/login')}>
                                Go to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Reset Your Password
                                </h1>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Enter your new password below
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Reset Password
                            </Button>
                        </form>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

function RequestResetPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            setSuccess(true);
            analyticsEvent({
                action: 'password_reset_request',
                category: 'Authentication'
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to request password reset');
            analyticsEvent({
                action: 'password_reset_request_error',
                category: 'Authentication',
                label: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="max-w-md w-full">
                <Card.Body>
                    {success ? (
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Check Your Email
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                If an account exists with that email address, we've sent password reset instructions.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Reset Your Password
                                </h1>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Enter your email address and we'll send you instructions to reset your password.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Send Reset Instructions
                            </Button>
                        </form>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
} 