'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
    id: string;
    name: string;
    type: 'page' | 'database';
    action: 'created' | 'updated';
    date: string;
}

interface ActivityTimelineProps {
    activities: Activity[];
    className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
    return (
        <Card className={className}>
            <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Activity
                </h3>
            </Card.Header>
            <Card.Body>
                <div className="flow-root">
                    <ul className="-mb-8">
                        {activities.map((activity, index) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {index !== activities.length - 1 && (
                                        <span
                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                                                activity.action === 'created'
                                                    ? 'bg-green-500'
                                                    : 'bg-blue-500'
                                            }`}>
                                                {activity.action === 'created' ? (
                                                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {activity.action === 'created' ? 'Created' : 'Updated'}{' '}
                                                    <span className="font-medium">{activity.name}</span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {activity.type}
                                                </p>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card.Body>
        </Card>
    );
} 