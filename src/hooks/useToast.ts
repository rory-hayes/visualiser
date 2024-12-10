import { useState, useCallback } from 'react';
import { ToastType } from '@/components/ui/Toast';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        ({ type, title, message, duration }: Omit<Toast, 'id'>) => {
            const id = Math.random().toString(36).substr(2, 9);
            setToasts((prev) => [...prev, { id, type, title, message, duration }]);
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'success', title, message });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'error', title, message });
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'warning', title, message });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'info', title, message });
        },
        [addToast]
    );

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };
} 