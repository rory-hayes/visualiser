'use client';

import React from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col justify-center py-12 bg-gray-50 dark:bg-gray-900">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {children}
                </div>
            </div>
        </AuthProvider>
    );
} 