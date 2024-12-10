'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="m-4">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                        >
                            Reload Page
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
} 