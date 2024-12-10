'use client';

import React from 'react';
import { useWorkspaceAnalytics } from '@/hooks/useWorkspaceAnalytics';
import { event as analyticsEvent } from '@/utils/analytics';

export default function WorkspaceAnalytics() {
    const { data, isLoading, error } = useWorkspaceAnalytics();

    React.useEffect(() => {
        analyticsEvent({
            action: 'view_analytics',
            category: 'Workspace',
            label: 'Analytics View'
        });
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-100 h-48 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-red-800">
                Failed to load analytics data
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overview Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Pages</p>
                        <p className="text-2xl font-bold">{data?.totalPages}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Databases</p>
                        <p className="text-2xl font-bold">{data?.totalDatabases}</p>
                    </div>
                </div>
            </div>

            {/* Properties Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Most Used Properties</h3>
                <div className="space-y-3">
                    {data?.mostUsedProperties.map((prop) => (
                        <div key={prop.name} className="flex justify-between items-center">
                            <span className="text-gray-700">{prop.name}</span>
                            <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {prop.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {data?.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4">
                            <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.action)}`} />
                            <div>
                                <p className="font-medium">{activity.name}</p>
                                <p className="text-sm text-gray-600">
                                    {activity.type} • {formatDate(activity.date)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function getActivityColor(action: string): string {
    switch (action) {
        case 'created':
            return 'bg-green-500';
        case 'updated':
            return 'bg-blue-500';
        case 'deleted':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
} 