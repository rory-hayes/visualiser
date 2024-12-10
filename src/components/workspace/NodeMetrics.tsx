'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ChartIcon, DatabaseIcon, PageIcon } from '@/components/icons';
import type { WorkspaceItem } from '@/types/workspace';

interface NodeMetricsProps {
    node: WorkspaceItem;
    items: WorkspaceItem[];
    className?: string;
}

export function NodeMetrics({ node, items, className }: NodeMetricsProps) {
    const descendants = React.useMemo(() => {
        const result = new Set<string>();
        
        function collectDescendants(nodeId: string) {
            const children = items.filter(item => item.parentId === nodeId);
            children.forEach(child => {
                result.add(child.id);
                collectDescendants(child.id);
            });
        }
        
        collectDescendants(node.id);
        return Array.from(result).map(id => items.find(item => item.id === id)!);
    }, [node.id, items]);

    const stats = React.useMemo(() => ({
        totalDescendants: descendants.length,
        pages: descendants.filter(item => item.type === 'page').length,
        databases: descendants.filter(item => item.type === 'database').length,
        maxDepth: Math.max(...descendants.map(item => {
            let depth = 0;
            let current = item;
            while (current.parentId && current.parentId !== node.id) {
                depth++;
                current = items.find(i => i.id === current.parentId)!;
            }
            return depth + 1;
        }))
    }), [descendants, node.id, items]);

    return (
        <Card className={className}>
            <CardHeader>
                <h3 className="text-lg font-medium">Metrics</h3>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ChartIcon className="w-4 h-4" />
                            Total Items
                        </div>
                        <p className="text-2xl font-semibold">{stats.totalDescendants}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <PageIcon className="w-4 h-4" />
                            Pages
                        </div>
                        <p className="text-2xl font-semibold">{stats.pages}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DatabaseIcon className="w-4 h-4" />
                            Databases
                        </div>
                        <p className="text-2xl font-semibold">{stats.databases}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ChartIcon className="w-4 h-4" />
                            Max Depth
                        </div>
                        <p className="text-2xl font-semibold">{stats.maxDepth}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 