'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SyncStatusProps {
    status: 'success' | 'error' | 'syncing' | 'idle';
    lastSynced?: Date;
    className?: string;
}

export function SyncStatus({ status, lastSynced, className }: SyncStatusProps) {
    const statusColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        syncing: 'bg-blue-500 animate-pulse',
        idle: 'bg-gray-500',
    };

    const statusMessages = {
        success: 'Synced',
        error: 'Sync failed',
        syncing: 'Syncing...',
        idle: 'Ready to sync',
    };

    return (
        <div className={cn('flex items-center space-x-2', className)}>
            <div
                className={cn(
                    'w-2 h-2 rounded-full',
                    statusColors[status]
                )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
                {statusMessages[status]}
            </span>
            {lastSynced && status !== 'syncing' && (
                <span className="text-sm text-gray-500">
                    ({new Date(lastSynced).toLocaleTimeString()})
                </span>
            )}
        </div>
    );
} 