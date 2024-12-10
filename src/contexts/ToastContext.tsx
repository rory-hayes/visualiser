'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { Toast, ToastContainer, type ToastProps } from '@/components/ui/Toast';

interface ToastContextType {
    show: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

    const show = useCallback((props: ToastProps) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { ...props, id }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <ToastContainer>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}; 