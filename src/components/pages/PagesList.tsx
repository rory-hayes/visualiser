'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { DocumentIcon } from '@/components/icons';

interface Page {
    id: string;
    pageId: string;
    title: string;
    type: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface PagesListProps {
    pages: Page[];
}

export function PagesList({ pages }: PagesListProps) {
    const [selectedPage, setSelectedPage] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {pages.map((page) => (
                <Card
                    key={page.id}
                    className={`cursor-pointer transition-colors ${
                        selectedPage === page.id
                            ? 'ring-2 ring-primary-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedPage(page.id)}
                >
                    <Card.Body className="flex items-center">
                        <DocumentIcon className="w-5 h-5 text-gray-400" />
                        <div className="ml-4 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {page.title}
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                    Updated {formatDistanceToNow(new Date(page.updatedAt))} ago
                                </span>
                                <span>•</span>
                                <span>
                                    Created {formatDistanceToNow(new Date(page.createdAt))} ago
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://notion.so/${page.pageId}`, '_blank');
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