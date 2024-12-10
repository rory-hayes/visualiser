'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';
import { SyncIcon } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';

interface SyncButtonProps {
    lastSynced: Date;
    className?: string;
}

export function SyncButton({ lastSynced, className }: SyncButtonProps) {
    const { mutate: sync, isPending } = useWorkspaceSync();

    return (
        <div className={className}>
            <Button
                onClick={() => sync()}
                isLoading={isPending}
                variant="outline"
                className="flex items-center space-x-2"
            >
                <SyncIcon className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
            </Button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Last synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
            </p>
        </div>
    );
} 