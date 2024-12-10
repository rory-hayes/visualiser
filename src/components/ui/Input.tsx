'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <div className="relative">
                <input
                    className={cn(
                        'w-full px-3 py-2 border rounded-md text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error
                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                        'dark:bg-gray-800',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input'; 