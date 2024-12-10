'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowUpIcon, ArrowDownIcon } from '@/components/icons';
import type { WorkspaceItem } from '@/types/workspace';

interface NodeRelationshipsProps {
    node: WorkspaceItem;
    items: WorkspaceItem[];
    onNodeSelect: (item: WorkspaceItem) => void;
    className?: string;
}

export function NodeRelationships({ node, items, onNodeSelect, className }: NodeRelationshipsProps) {
    const parent = items.find(item => item.id === node.parentId);
    const children = items.filter(item => item.parentId === node.id);

    return (
        <Card className={className}>
            <CardHeader>
                <h3 className="text-lg font-medium">Relationships</h3>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {parent && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-1 mb-2">
                                <ArrowUpIcon className="w-4 h-4" />
                                Parent
                            </h4>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => onNodeSelect(parent)}
                            >
                                {parent.title}
                            </Button>
                        </div>
                    )}

                    {children.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-1 mb-2">
                                <ArrowDownIcon className="w-4 h-4" />
                                Children ({children.length})
                            </h4>
                            <div className="space-y-2">
                                {children.map(child => (
                                    <Button
                                        key={child.id}
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => onNodeSelect(child)}
                                    >
                                        {child.title}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!parent && children.length === 0 && (
                        <p className="text-sm text-gray-500 text-center">
                            No relationships found
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 