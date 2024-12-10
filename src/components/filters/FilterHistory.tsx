'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HistoryIcon, UndoIcon, RedoIcon } from '@/components/icons';
import type { FilterHistoryEntry } from '@/types/filters';

interface FilterHistoryProps {
    history: FilterHistoryEntry[];
    onRestore: (entry: FilterHistoryEntry) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    className?: string;
}

export function FilterHistory({
    history,
    onRestore,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    className,
}: FilterHistoryProps) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Filter History
                </h3>
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onUndo}
                        disabled={!canUndo}
                        aria-label="Undo"
                    >
                        <UndoIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRedo}
                        disabled={!canRedo}
                        aria-label="Redo"
                    >
                        <RedoIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                {history.map((entry) => (
                    <Card
                        key={entry.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => onRestore(entry)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <HistoryIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                    <div className="text-sm font-medium">
                                        {entry.criteria.type || 'All Types'} •{' '}
                                        {entry.criteria.level || 'All Levels'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {format(entry.timestamp, 'MMM d, h:mm a')}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRestore(entry);
                                }}
                            >
                                Restore
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 