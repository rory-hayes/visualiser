'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const settings = await prisma.userSettings.findUnique({
        where: { userEmail: session.user.email },
    });

    if (!settings) {
        redirect('/dashboard/connect');
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Settings
                </h1>
                <SettingsTabs initialSettings={settings} />
            </div>
        </DashboardLayout>
    );
} 