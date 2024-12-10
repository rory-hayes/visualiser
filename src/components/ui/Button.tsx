'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
                outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
                ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
                link: 'text-primary-600 underline-offset-4 hover:underline dark:text-primary-400',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-3',
                lg: 'h-12 px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => (
        <button
            className={cn(buttonVariants({ variant, size }), className)}
            ref={ref}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center space-x-2">
                    <Spinner className="w-4 h-4" />
                    <span>{children}</span>
                </div>
            ) : (
                children
            )}
        </button>
    )
);

Button.displayName = 'Button';

export { Button, type ButtonProps, buttonVariants }; 