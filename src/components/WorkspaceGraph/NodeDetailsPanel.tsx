'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Node } from '@/types/workspace';
import { useNodeContent } from '@/hooks/useNodeContent';
import { Loading } from '@/components/ui/Loading';

interface NodeDetailsPanelProps {
    node: Node;
    onClose: () => void;
}

export function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
    const { data, isLoading } = useNodeContent(node.id, node.type);

    return (
        <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-auto">
            <Card>
                <Card.Header className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {node.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {node.type}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <span className="sr-only">Close panel</span>
                        ×
                    </Button>
                </Card.Header>
                <Card.Body>
                    {isLoading ? (
                        <Loading text="Loading details..." />
                    ) : (
                        <div className="space-y-4">
                            {node.type === 'database' && (
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        Properties
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(data?.database?.properties || {}).map(([key, value]: [string, any]) => (
                                            <div key={key} className="text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">{key}:</span>{' '}
                                                <span className="text-gray-900 dark:text-white">{value.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {node.type === 'page' && data?.blocks && (
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        Content Preview
                                    </h4>
                                    <div className="prose dark:prose-invert max-w-none">
                                        {data.blocks.slice(0, 5).map((block: any) => (
                                            <div key={block.id} className="text-sm text-gray-600 dark:text-gray-300">
                                                {block.type === 'paragraph' && block.paragraph.rich_text.map((text: any) => text.plain_text).join('')}
                                                {block.type === 'heading_1' && <h1>{block.heading_1.rich_text.map((text: any) => text.plain_text).join('')}</h1>}
                                                {block.type === 'heading_2' && <h2>{block.heading_2.rich_text.map((text: any) => text.plain_text).join('')}</h2>}
                                                {block.type === 'heading_3' && <h3>{block.heading_3.rich_text.map((text: any) => text.plain_text).join('')}</h3>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <Button
                                    onClick={() => window.open(`https://notion.so/${node.id}`, '_blank')}
                                    className="w-full"
                                >
                                    Open in Notion
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
} 