'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import {
    ChartIcon,
    DocumentIcon,
    DatabaseIcon,
    SettingsIcon,
    MenuIcon,
    SunIcon,
    MoonIcon,
    ComputerIcon,
} from '@/components/icons';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: ChartIcon },
    { name: 'Pages', href: '/dashboard/pages', icon: DocumentIcon },
    { name: 'Databases', href: '/dashboard/databases', icon: DatabaseIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const themeOptions = [
        { value: 'light', label: 'Light', icon: SunIcon },
        { value: 'dark', label: 'Dark', icon: MoonIcon },
        { value: 'system', label: 'System', icon: ComputerIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
                        <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                            Notion Graph
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <nav className="flex-1 px-2 py-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                            isActive
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'mr-3 flex-shrink-0 h-6 w-6',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                            )}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex-shrink-0 w-full group block">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name}`}
                                        alt={session?.user?.name || 'User avatar'}
                                    />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {session?.user?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                                        className="appearance-none bg-transparent pr-8 py-1 text-sm text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
                                    >
                                        {themeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                        {themeOptions.find((option) => option.value === theme)?.icon({ className: 'h-4 w-4' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
                <div className="fixed inset-0 z-40 flex">
                    {/* Overlay */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    {/* Menu */}
                    <div
                        className={cn(
                            'fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out',
                            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        )}
                    >
                        {/* Mobile menu content - similar to desktop sidebar */}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64">
                <div className="max-w-7xl mx-auto flex flex-col flex-1">
                    <main className="flex-1">{children}</main>
                </div>
            </div>
        </div>
    );
} 