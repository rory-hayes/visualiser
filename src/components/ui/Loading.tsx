'use client';

import { Spinner } from '@/components/ui/Spinner';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function Loading({ message = 'Loading...', fullScreen = false }: LoadingProps) {
    const content = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            {message && (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            {content}
        </div>
    );
} 