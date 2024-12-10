'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { WorkspaceGraph } from '@/components/WorkspaceGraph';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Loading } from '@/components/ui/Loading';

export default function GraphPage() {
    const { data, isLoading, error } = useWorkspace();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Workspace Graph
                </h1>
            </div>

            {isLoading ? (
                <Card>
                    <Card.Body>
                        <Loading text="Loading graph data..." />
                    </Card.Body>
                </Card>
            ) : error ? (
                <Card>
                    <Card.Body>
                        <div className="text-red-600 dark:text-red-400">
                            Failed to load graph data
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <Card>
                    <Card.Body>
                        <WorkspaceGraph data={data} />
                    </Card.Body>
                </Card>
            )}
        </div>
    );
} 