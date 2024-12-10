'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/icons';
import { NodeRelationships } from './NodeRelationships';
import { NodeMetrics } from './NodeMetrics';
import type { WorkspaceItem } from '@/types/workspace';

interface NodeDetailsProps {
    node: WorkspaceItem;
    items: WorkspaceItem[];
    onClose: () => void;
    onNodeSelect: (item: WorkspaceItem) => void;
}

export function NodeDetails({ node, items, onClose, onNodeSelect }: NodeDetailsProps) {
    return (
        <div className="absolute top-4 right-4 space-y-4">
            <Card className="w-80">
                <CardHeader className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-medium">{node.title}</h3>
                        <p className="text-sm text-gray-500 capitalize">{node.type}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {node.parentId && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Parent</p>
                                <p className="text-sm">{node.parentId}</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(`https://notion.so/${node.id}`, '_blank')}
                        >
                            Open in Notion
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <NodeMetrics
                node={node}
                items={items}
                className="w-80"
            />
            <NodeRelationships
                node={node}
                items={items}
                onNodeSelect={onNodeSelect}
                className="w-80"
            />
        </div>
    );
} 