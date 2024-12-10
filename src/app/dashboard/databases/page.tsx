import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DatabasesList } from '@/components/databases/DatabasesList';
import { DatabaseFilters } from '@/components/databases/DatabaseFilters';
import { DatabaseSort } from '@/components/databases/DatabaseSort';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { DatabaseIcon } from '@/components/icons';

export default async function DatabasesPage() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const workspace = await prisma.workspace.findUnique({
        where: { userEmail: session.user.email },
        include: {
            databases: {
                orderBy: { updatedAt: 'desc' },
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
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Databases
                        </h1>
                        <div className="flex items-center space-x-4">
                            <DatabaseFilters />
                            <DatabaseSort />
                        </div>
                    </div>

                    {workspace.databases.length === 0 ? (
                        <Card>
                            <Card.Body>
                                <div className="text-center py-12">
                                    <DatabaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                        No databases
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Your Notion workspace doesn't have any databases yet.
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    ) : (
                        <DatabasesList databases={workspace.databases} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
} 