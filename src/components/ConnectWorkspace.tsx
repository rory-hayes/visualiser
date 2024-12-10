'use client';

import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NotionIcon } from '@/components/icons';

export function ConnectWorkspace() {
    return (
        <Card>
            <Card.Header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Connect Your Notion Workspace
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    To get started, connect your Notion workspace to visualize and analyze your content structure.
                </p>
            </Card.Header>
            <Card.Body className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white">What you'll get:</h3>
                    <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Visual representation of your workspace structure
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Insights into content organization and relationships
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Automatic sync to keep your visualization up to date
                        </li>
                    </ul>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={() => signIn('notion', { callbackUrl: '/dashboard' })}
                        size="lg"
                        className="flex items-center"
                    >
                        <NotionIcon className="w-5 h-5 mr-2" />
                        Connect with Notion
                    </Button>
                </div>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    By connecting, you agree to grant read-only access to your Notion workspace.
                </div>
            </Card.Body>
        </Card>
    );
} 