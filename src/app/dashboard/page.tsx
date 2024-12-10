'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WorkspaceGraph } from '@/components/WorkspaceGraph';
import { DashboardOverview } from '@/components/DashboardOverview';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';
import { Loading } from '@/components/ui/Loading';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { WorkspaceOverview } from '@/components/dashboard/WorkspaceOverview';

export default async function DashboardPage() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const workspace = await prisma.workspace.findUnique({
        where: { userEmail: session.user.email },
        include: {
            pages: true,
            databases: true,
            _count: {
                select: {
                    pages: true,
                    databases: true,
                },
            },
        },
    });

    if (!workspace) {
        redirect('/dashboard/connect');
    }

    return (
        <DashboardLayout>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Workspace Overview
                    </h1>

                    <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                        <WorkspaceOverview
                            totalPages={workspace._count.pages}
                            totalDatabases={workspace._count.databases}
                            lastSynced={workspace.lastSynced}
                        />
                    </div>

                    <Card>
                        <Card.Header>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Workspace Graph
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Visual representation of your Notion workspace structure
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <div className="h-[600px]">
                                <WorkspaceGraph
                                    data={{
                                        nodes: [
                                            ...workspace.pages.map(page => ({
                                                id: page.pageId,
                                                type: 'page',
                                                title: page.title,
                                                parentId: page.parentId,
                                            })),
                                            ...workspace.databases.map(db => ({
                                                id: db.databaseId,
                                                type: 'database',
                                                title: db.title,
                                                parentId: db.parentId,
                                            })),
                                        ],
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
} 