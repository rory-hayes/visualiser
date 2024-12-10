'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { PageIcon, DatabaseIcon } from '@/components/icons';
import type { WorkspaceItem } from '@/types/workspace';

interface WorkspaceItemProps {
    item: WorkspaceItem;
    onClick?: (item: WorkspaceItem) => void;
    className?: string;
}

export function WorkspaceItem({ item, onClick, className }: WorkspaceItemProps) {
    const Icon = item.type === 'page' ? PageIcon : DatabaseIcon;
    const iconColor = item.type === 'page' ? 'text-blue-500' : 'text-green-500';

    return (
        <Card 
            className={`hover:shadow-md transition-shadow ${className}`}
            onClick={() => onClick?.(item)}
            data-testid={`workspace-item-${item.id}`}
        >
            <Card.Body className="flex items-center space-x-4">
                <Icon className={`w-6 h-6 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{item.type}</span>
                        {item.updatedAt && (
                            <>
                                <span>•</span>
                                <span>
                                    Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
} 