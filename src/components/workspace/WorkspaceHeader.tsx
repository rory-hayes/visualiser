'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ListIcon, GridIcon, RefreshIcon } from '@/components/icons';

interface WorkspaceHeaderProps {
    view: 'list' | 'graph';
    onViewChange: (view: 'list' | 'graph') => void;
    lastSynced: Date | null;
    onRefresh: () => Promise<void>;
    isLoading?: boolean;
}

export function WorkspaceHeader({
    view,
    onViewChange,
    lastSynced,
    onRefresh,
    isLoading
}: WorkspaceHeaderProps) {
    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">Workspace</h1>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        <Button
                            variant={view === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange('list')}
                            aria-label="List view"
                        >
                            <ListIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={view === 'graph' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange('graph')}
                            aria-label="Graph view"
                        >
                            <GridIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {lastSynced && (
                        <span className="text-sm text-gray-500">
                            Last synced {formatDistanceToNow(lastSynced)} ago
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        isLoading={isLoading}
                    >
                        <RefreshIcon className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>
        </header>
    );
} 