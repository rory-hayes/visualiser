'use client';

import React from 'react';
import { useFilterContext } from '@/contexts/FilterContext';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { PageIcon, DatabaseIcon } from '@/components/icons';
import type { WorkspaceItem } from '@/types/workspace';

export function FilteredList() {
    const { items } = useFilterContext();

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No items match your filters
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item: WorkspaceItem) => (
                <Card key={item.id}>
                    <CardContent className="flex items-center space-x-4">
                        {item.type === 'page' ? (
                            <PageIcon className="w-6 h-6 text-blue-500" />
                        ) : (
                            <DatabaseIcon className="w-6 h-6 text-green-500" />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Updated {formatDistanceToNow(new Date(item.updatedAt!), { addSuffix: true })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 