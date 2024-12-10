'use client';

import { Button } from '@/components/ui/Button';

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    className?: string;
}

export function ZoomControls({
    onZoomIn,
    onZoomOut,
    onReset,
    className,
}: ZoomControlsProps) {
    return (
        <div className={`absolute bottom-4 right-4 flex space-x-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={onZoomIn}
                className="p-2"
                aria-label="Zoom in"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onZoomOut}
                className="p-2"
                aria-label="Zoom out"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 12H6"
                    />
                </svg>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="p-2"
                aria-label="Reset zoom"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
            </Button>
        </div>
    );
} 