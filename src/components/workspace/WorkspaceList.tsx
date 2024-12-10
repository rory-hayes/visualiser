'use client';

import React from 'react';
import { WorkspaceItem } from './WorkspaceItem';
import type { WorkspaceItem as WorkspaceItemType } from '@/types/workspace';
import { EmptyState } from '@/components/ui/EmptyState';

interface WorkspaceListProps {
    items: WorkspaceItemType[];
    className?: string;
}

export function WorkspaceList({ items, className }: WorkspaceListProps) {
    if (items.length === 0) {
        return (
            <EmptyState
                title="No items found"
                description="Try adjusting your filters or search terms"
                className={className}
            />
        );
    }

    return (
        <div className={className}>
            <div className="space-y-2">
                {items.map(item => (
                    <WorkspaceItem
                        key={item.id}
                        item={item}
                        data-testid={`workspace-item-${item.id}`}
                    />
                ))}
            </div>
        </div>
    );
} 