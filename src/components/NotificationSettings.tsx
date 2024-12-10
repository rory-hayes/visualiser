'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

export function NotificationSettings() {
    const { data: settings, updateSettings } = useNotificationSettings();

    const handleSettingChange = (key: string, value: boolean) => {
        updateSettings({ [key]: value });
    };

    return (
        <Card>
            <Card.Header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Notification Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Configure how and when you receive notifications
                </p>
            </Card.Header>
            <Card.Body className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            Email Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive important updates via email
                        </p>
                    </div>
                    <Switch
                        checked={settings?.emailNotifications ?? true}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            Sync Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified when workspace sync completes
                        </p>
                    </div>
                    <Switch
                        checked={settings?.syncNotifications ?? true}
                        onCheckedChange={(checked) => handleSettingChange('syncNotifications', checked)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            Weekly Digest
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive weekly summary of workspace changes
                        </p>
                    </div>
                    <Switch
                        checked={settings?.weeklyDigest ?? false}
                        onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
                    />
                </div>
            </Card.Body>
        </Card>
    );
} 