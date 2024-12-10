'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { DatabaseIcon } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/cn';

interface Database {
    id: string;
    databaseId: string;
    title: string;
    parentId: string | null;
    updatedAt: Date;
}

interface DatabaseListProps {
    databases: Database[];
    onDatabaseClick?: (database: Database) => void;
    className?: string;
}

export function DatabaseList({ databases, onDatabaseClick, className }: DatabaseListProps) {
    if (databases.length === 0) {
        return (
            <Card className={className}>
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
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {databases.map((database) => (
                <Card
                    key={database.id}
                    onClick={() => onDatabaseClick?.(database)}
                    className={cn(
                        'transition-all duration-200 hover:shadow-md',
                        onDatabaseClick && 'cursor-pointer'
                    )}
                >
                    <Card.Body className="flex items-center space-x-4">
                        <DatabaseIcon className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {database.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Updated {formatDistanceToNow(new Date(database.updatedAt), { addSuffix: true })}
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
} 