'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { PropertyDistributionChart } from '@/components/PropertyDistributionChart';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useWorkspaceAnalytics } from '@/hooks/useWorkspaceAnalytics';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

export default function AnalyticsPage() {
    const { data, isLoading, error } = useWorkspaceAnalytics();
    const { mutate: syncWorkspace, isPending: isSyncing } = useWorkspaceSync();

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loading text="Loading analytics..." />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Card>
                    <Card.Body>
                        <div className="text-center text-red-600 dark:text-red-400">
                            Failed to load analytics data
                        </div>
                    </Card.Body>
                </Card>
            </DashboardLayout>
        );
    }

    const propertyData = data.mostUsedProperties.map(prop => ({
        name: prop.name,
        value: prop.count
    }));

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Workspace Analytics
                        </h1>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Workspace Analytics
                </h1>
            </div>

            {isLoading ? (
                <Loading text="Loading analytics..." />
            ) : error ? (
                <div className="text-red-600 dark:text-red-400">
                    Failed to load analytics data
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Usage Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <Card.Body>
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                        <DocumentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {data.totalPages}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Pages
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Body>
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                        <DatabaseIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {data.totalDatabases}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Databases
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Body>
                                <div className="flex items-center">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <ChartIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {data.mostUsedProperties.length}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Property Types
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Property Usage */}
                    <Card>
                        <Card.Header>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Most Used Properties
                            </h2>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                {data.mostUsedProperties.map((prop) => (
                                    <div
                                        key={prop.name}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {prop.name}
                                        </span>
                                        <div className="flex items-center">
                                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                                                    style={{
                                                        width: `${(prop.count / data.mostUsedProperties[0].count) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                                                {prop.count} uses
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <Card.Header>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Recent Activity
                            </h2>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                {data.recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center space-x-4"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className={`w-2 h-2 rounded-full ${
                                                activity.action === 'created'
                                                    ? 'bg-green-500'
                                                    : activity.action === 'updated'
                                                    ? 'bg-blue-500'
                                                    : 'bg-red-500'
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {activity.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {activity.type} • {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            )}
        </div>
    );
} 