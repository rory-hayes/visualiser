'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';
import { Loading } from '@/components/ui/Loading';
import { formatDistanceToNow } from 'date-fns';

const stats = [
    {
        name: 'Total Pages',
        icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: 'Total Databases',
        icon: (
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
        ),
    },
    {
        name: 'Last Synced',
        icon: (
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
];

export function DashboardOverview() {
    const { data: workspace, isLoading, error } = useWorkspace();
    const { mutate: syncWorkspace, isPending: isSyncing } = useWorkspaceSync();

    if (isLoading) {
        return (
            <Card>
                <Card.Body>
                    <Loading text="Loading workspace data..." />
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">
                            Failed to load workspace data
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const statValues = {
        'Total Pages': workspace?.pages.length || 0,
        'Total Databases': workspace?.databases.length || 0,
        'Last Synced': workspace?.lastSynced
            ? formatDistanceToNow(new Date(workspace.lastSynced), { addSuffix: true })
            : 'Never',
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.name}>
                        <Card.Body>
                            <div className="flex items-center">
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    {stat.icon}
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {statValues[stat.name as keyof typeof statValues]}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {stat.name}
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            <Card>
                <Card.Body>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Workspace Sync
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Keep your workspace data up to date
                            </p>
                        </div>
                        <Button
                            onClick={() => syncWorkspace()}
                            isLoading={isSyncing}
                        >
                            Sync Now
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}