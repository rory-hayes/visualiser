'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { DatabaseIcon } from '@/components/icons';

interface Database {
    id: string;
    databaseId: string;
    title: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface DatabasesListProps {
    databases: Database[];
}

export function DatabasesList({ databases }: DatabasesListProps) {
    const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {databases.map((database) => (
                <Card
                    key={database.id}
                    className={`cursor-pointer transition-colors ${
                        selectedDatabase === database.id
                            ? 'ring-2 ring-primary-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedDatabase(database.id)}
                >
                    <Card.Body className="flex items-center">
                        <DatabaseIcon className="w-5 h-5 text-green-500" />
                        <div className="ml-4 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {database.title}
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                    Updated {formatDistanceToNow(new Date(database.updatedAt))} ago
                                </span>
                                <span>•</span>
                                <span>
                                    Created {formatDistanceToNow(new Date(database.createdAt))} ago
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://notion.so/${database.databaseId}`, '_blank');
                            }}
                            className="ml-4 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
                        >
                            Open in Notion
                        </button>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
} 