'use client';

import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

interface AppearanceSettingsProps {
    settings: any;
}

export function AppearanceSettings({ settings }: AppearanceSettingsProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Theme
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Customize the appearance of the application.
                    </p>
                </Card.Header>
                <Card.Body className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Color Theme
                        </label>
                        <Select
                            options={[
                                { value: 'light', label: 'Light' },
                                { value: 'dark', label: 'Dark' },
                                { value: 'system', label: 'System' },
                            ]}
                            value={theme}
                            onChange={(value) => setTheme(value)}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Animate Transitions
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Enable smooth transitions between pages and states.
                            </p>
                        </div>
                        <Switch
                            checked={settings.animateTransitions}
                            onCheckedChange={async (checked) => {
                                // TODO: Implement settings update
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Show Labels
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Show labels in the workspace graph.
                            </p>
                        </div>
                        <Switch
                            checked={settings.showLabels}
                            onCheckedChange={async (checked) => {
                                // TODO: Implement settings update
                            }}
                        />
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 