'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { NotificationSettings } from '@/components/NotificationSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';

const tabs = [
    { name: 'Account', component: AccountSettings },
    { name: 'Workspace', component: WorkspaceSettings },
    { name: 'Appearance', component: AppearanceSettings },
    { name: 'Notifications', component: NotificationSettings },
];

interface SettingsTabsProps {
    initialSettings: any;
}

export function SettingsTabs({ initialSettings }: SettingsTabsProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                <Tab.List className="flex border-b border-gray-200 dark:border-gray-700">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.name}
                            className={({ selected }) =>
                                cn(
                                    'px-4 py-2 text-sm font-medium focus:outline-none',
                                    selected
                                        ? 'text-primary-600 border-b-2 border-primary-600'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                )
                            }
                        >
                            {tab.name}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="p-6">
                    {tabs.map((tab, idx) => (
                        <Tab.Panel
                            key={idx}
                            className={cn(
                                'focus:outline-none',
                                selectedIndex === idx ? 'block' : 'hidden'
                            )}
                        >
                            <tab.component settings={initialSettings} />
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
} 