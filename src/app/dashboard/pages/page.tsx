import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PagesList } from '@/components/pages/PagesList';
import { prisma } from '@/lib/prisma';

export default async function PagesPage() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const workspace = await prisma.workspace.findUnique({
        where: { userEmail: session.user.email },
        include: {
            pages: {
                orderBy: { updatedAt: 'desc' },
            },
        },
    });

    if (!workspace) {
        redirect('/dashboard/connect');
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pages
                    </h1>
                    <div className="flex space-x-2">
                        <PageFilters />
                        <PageSort />
                    </div>
                </div>
                <PagesList pages={workspace.pages} />
            </div>
        </DashboardLayout>
    );
} 