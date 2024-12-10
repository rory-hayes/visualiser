'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

const layoutOptions = [
    { value: 'force', label: 'Force-directed' },
    { value: 'hierarchical', label: 'Hierarchical' },
    { value: 'circular', label: 'Circular' },
];

export function WorkspaceSettings() {
    const { data: settings, updateSettings } = useWorkspaceSettings();
    const { mutate: syncWorkspace, isPending: isSyncing } = useWorkspaceSync();

    const handleSettingChange = (key: string, value: any) => {
        updateSettings({ [key]: value });
    };

    return (
        <Card>
            <Card.Header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Workspace Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Configure how your workspace is displayed and organized
                </p>
            </Card.Header>
            <Card.Body className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            Show Labels
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Display node labels in the workspace graph
                        </p>
                    </div>
                    <Switch
                        checked={settings?.showLabels ?? true}
                        onCheckedChange={(checked) => handleSettingChange('showLabels', checked)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            Animate Transitions
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enable smooth animations when the graph updates
                        </p>
                    </div>
                    <Switch
                        checked={settings?.animateTransitions ?? true}
                        onCheckedChange={(checked) => handleSettingChange('animateTransitions', checked)}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                        Default Layout
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Choose how nodes are arranged in the graph
                    </p>
                    <Select
                        className="mt-2"
                        value={settings?.defaultLayout ?? 'force'}
                        options={layoutOptions}
                        onChange={(value) => handleSettingChange('defaultLayout', value)}
                    />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                Workspace Sync
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manually sync your Notion workspace data
                            </p>
                        </div>
                        <Button
                            onClick={() => syncWorkspace()}
                            isLoading={isSyncing}
                        >
                            Sync Now
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
} 