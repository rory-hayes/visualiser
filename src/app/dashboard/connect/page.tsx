'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConnectWorkspace } from '@/components/ConnectWorkspace';
import { prisma } from '@/lib/prisma';

export default async function ConnectPage() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    // Check if user already has a connected workspace
    const workspace = await prisma.workspace.findUnique({
        where: { userEmail: session.user.email },
    });

    if (workspace) {
        redirect('/dashboard');
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <ConnectWorkspace />
            </div>
        </DashboardLayout>
    );
} 