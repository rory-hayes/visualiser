'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/utils/cn';
import { CloseIcon } from '@/components/icons';

export interface ToastProps {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
}

const ToastProvider = ToastPrimitive.Provider;

export function ToastContainer({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
            {children}
        </ToastProvider>
    );
}

export function Toast({ title, description, variant = 'default' }: ToastProps) {
    return (
        <ToastPrimitive.Root
            className={cn(
                'flex w-full max-w-sm items-center gap-x-4 rounded-lg p-4 shadow-lg',
                variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-gray-900'
            )}
        >
            <div className="flex-1 space-y-1">
                {title && <div className="font-semibold">{title}</div>}
                {description && <div className="text-sm">{description}</div>}
            </div>
            <ToastPrimitive.Close className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Close</span>
                <CloseIcon className="h-5 w-5" />
            </ToastPrimitive.Close>
        </ToastPrimitive.Root>
    );
}

export const toast = {
    show: (props: ToastProps) => {
        const event = new CustomEvent('toast', { detail: props });
        window.dispatchEvent(event);
    }
};