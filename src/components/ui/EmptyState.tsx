'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function EmptyState({ title, description, children, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12', className)}>
            <div className="text-center">
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                </h3>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
                {children && <div className="mt-6">{children}</div>}
            </div>
        </div>
    );
} 