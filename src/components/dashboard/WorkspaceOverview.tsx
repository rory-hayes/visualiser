'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { DocumentIcon, DatabaseIcon, ClockIcon, SyncIcon } from '@/components/icons';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';
import { Button } from '@/components/ui/Button';

interface WorkspaceOverviewProps {
    totalPages: number;
    totalDatabases: number;
    lastSynced: Date;
}

export function WorkspaceOverview({ totalPages, totalDatabases, lastSynced }: WorkspaceOverviewProps) {
    const { mutate: syncWorkspace, isPending: isSyncing } = useWorkspaceSync();

    const stats = [
        {
            title: 'Total Pages',
            value: totalPages,
            icon: DocumentIcon,
            color: 'text-blue-500',
        },
        {
            title: 'Total Databases',
            value: totalDatabases,
            icon: DatabaseIcon,
            color: 'text-green-500',
        },
        {
            title: 'Last Synced',
            value: formatDistanceToNow(new Date(lastSynced), { addSuffix: true }),
            icon: ClockIcon,
            color: 'text-purple-500',
        },
    ];

    return (
        <>
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <Card.Body className="flex items-center">
                        <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {stat.title}
                            </p>
                            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                                {stat.value}
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            ))}
            <Card>
                <Card.Body className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Sync Status
                        </p>
                        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {isSyncing ? 'Syncing...' : 'Ready to sync'}
                        </p>
                    </div>
                    <Button
                        onClick={() => syncWorkspace()}
                        isLoading={isSyncing}
                        className="flex items-center"
                    >
                        <SyncIcon className="w-4 h-4 mr-2" />
                        Sync Now
                    </Button>
                </Card.Body>
            </Card>
        </>
    );
} 