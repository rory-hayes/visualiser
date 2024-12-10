'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

interface WorkspaceSettingsProps {
    settings: any;
}

export function WorkspaceSettings({ settings }: WorkspaceSettingsProps) {
    const [syncInterval, setSyncInterval] = useState(settings.syncInterval || '3600');
    const { mutate: syncWorkspace, isPending: isSyncing } = useWorkspaceSync();

    const handleSyncIntervalChange = async (value: string) => {
        try {
            const response = await fetch('/api/settings/workspace', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ syncInterval: value }),
            });

            if (!response.ok) throw new Error('Failed to update sync interval');

            setSyncInterval(value);
            toast.success('Sync interval updated');
        } catch (error) {
            toast.error('Failed to update sync interval');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Workspace Sync
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure how your Notion workspace is synchronized.
                    </p>
                </Card.Header>
                <Card.Body className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto-sync Interval
                        </label>
                        <Select
                            options={[
                                { value: '900', label: 'Every 15 minutes' },
                                { value: '1800', label: 'Every 30 minutes' },
                                { value: '3600', label: 'Every hour' },
                                { value: '7200', label: 'Every 2 hours' },
                                { value: '14400', label: 'Every 4 hours' },
                                { value: '86400', label: 'Once a day' },
                            ]}
                            value={syncInterval}
                            onChange={handleSyncIntervalChange}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Manual Sync
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sync your workspace data now
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

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Default Layout
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Choose the default layout for your workspace visualization.
                    </p>
                </Card.Header>
                <Card.Body>
                    <Select
                        options={[
                            { value: 'force', label: 'Force-directed' },
                            { value: 'tree', label: 'Tree' },
                            { value: 'radial', label: 'Radial' },
                        ]}
                        value={settings.defaultLayout}
                        onChange={async (value) => {
                            // TODO: Implement layout update
                        }}
                    />
                </Card.Body>
            </Card>
        </div>
    );
} 