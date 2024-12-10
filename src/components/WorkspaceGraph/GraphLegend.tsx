'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

const legendItems = [
    { type: 'workspace', label: 'Workspace', color: '#FF4081' },
    { type: 'database', label: 'Database', color: '#4CAF50' },
    { type: 'page', label: 'Page', color: '#2196F3' },
    { type: 'teamspace', label: 'Team Space', color: '#FFC107' },
];

const connectionTypes = [
    { type: 'contains', label: 'Contains', color: '#999' },
    { type: 'entry', label: 'Database Entry', color: '#666' },
];

export function GraphLegend() {
    return (
        <div className="absolute top-4 right-4 space-y-4">
            <Card className="w-48">
                <Card.Body className="p-3 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Node Types
                    </h4>
                    <div className="space-y-2">
                        {legendItems.map(item => (
                            <div key={item.type} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            <Card className="w-48">
                <Card.Body className="p-3 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Connection Types
                    </h4>
                    <div className="space-y-2">
                        {connectionTypes.map(item => (
                            <div key={item.type} className="flex items-center space-x-2">
                                <div className="w-6 h-0.5" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 