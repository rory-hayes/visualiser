'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NotionLogo } from '@/components/icons/NotionLogo';
import { event as analyticsEvent } from '@/utils/analytics';
import { captureException } from '@/utils/sentry';

export function NotionConnect() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsLoading(true);
        setError(null);

        try {
            analyticsEvent({
                action: 'notion_connect_start',
                category: 'Integration',
                label: 'Notion Connect'
            });

            const result = await signIn('notion', {
                callbackUrl: '/dashboard',
                redirect: false
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            analyticsEvent({
                action: 'notion_connect_success',
                category: 'Integration'
            });
        } catch (error) {
            setError('Failed to connect to Notion. Please try again.');
            captureException(error);
            analyticsEvent({
                action: 'notion_connect_error',
                category: 'Integration',
                label: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <Card.Body className="text-center space-y-6">
                <div className="mx-auto w-16 h-16">
                    <NotionLogo className="w-full h-full text-black dark:text-white" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Connect Your Notion Workspace
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Connect your Notion workspace to visualize and analyze your content structure.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleConnect}
                    isLoading={isLoading}
                    className="w-full"
                >
                    {!isLoading && (
                        <NotionLogo className="w-5 h-5 mr-2" />
                    )}
                    Connect with Notion
                </Button>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                    By connecting, you agree to our{' '}
                    <a href="/terms" className="text-primary-600 hover:text-primary-500">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-600 hover:text-primary-500">
                        Privacy Policy
                    </a>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Protected by
                        </span>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Your data is secure and private. We only access the workspace information you choose to share.
                    </p>
                </div>
            </Card.Body>
        </Card>
    );
} 