'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from 'next-auth/react';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastProvider } from '@/contexts/ToastContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
                <ErrorBoundary>
                    <ThemeProvider>
                        <SessionProvider>
                            <QueryProvider>
                                <ToastProvider>
                                    {children}
                                </ToastProvider>
                                <ThemeToggle />
                            </QueryProvider>
                        </SessionProvider>
                    </ThemeProvider>
                </ErrorBoundary>
                <Analytics />
            </body>
        </html>
    );
} 