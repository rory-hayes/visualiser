'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/utils/cn';
import {
    ChartIcon,
    DocumentIcon,
    DatabaseIcon,
    SettingsIcon,
    MenuIcon,
    XIcon,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Notion Graph
                        </span>
                    </div>
                    <div className="mt-5 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                            isActive
                                                ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'mr-3 flex-shrink-0 h-6 w-6',
                                                isActive
                                                    ? 'text-gray-500 dark:text-gray-300'
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
                            <div className="flex items-center">
                                <div>
                                    <img
                                        className="inline-block h-9 w-9 rounded-full"
                                        src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name}`}
                                        alt=""
                                    />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {session?.user?.name}
                                    </p>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
                <div className="fixed inset-0 flex z-40">
                    <div
                        className={cn(
                            'fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300',
                            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    <div
                        className={cn(
                            'relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white dark:bg-gray-800 transition ease-in-out duration-300 transform',
                            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        )}
                    >
                        {/* Mobile menu content */}
                        {/* ... Similar to desktop sidebar but with close button ... */}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64 flex flex-col flex-1">
                <main className="flex-1">
                    <div className="py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
} 