'use client';

import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';

interface NotificationSettingsProps {
    settings: any;
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
    const updateSetting = async (key: string, value: boolean) => {
        try {
            const response = await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
            });

            if (!response.ok) throw new Error('Failed to update notification settings');

            toast.success('Notification settings updated');
        } catch (error) {
            toast.error('Failed to update notification settings');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Email Notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure when you receive email notifications.
                    </p>
                </Card.Header>
                <Card.Body className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sync Notifications
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive notifications when workspace sync completes.
                            </p>
                        </div>
                        <Switch
                            checked={settings.syncNotifications}
                            onCheckedChange={(checked) => updateSetting('syncNotifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Weekly Digest
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive a weekly summary of workspace changes.
                            </p>
                        </div>
                        <Switch
                            checked={settings.weeklyDigest}
                            onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
                        />
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Browser Notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure in-app notifications.
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Enable Notifications
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Show browser notifications for important updates.
                            </p>
                        </div>
                        <Switch
                            checked={settings.browserNotifications}
                            onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
                        />
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 