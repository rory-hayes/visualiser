'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { MinusIcon, PlusIcon, RotateIcon } from '@/components/icons';

interface GraphControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onZoomChange: (value: number) => void;
    className?: string;
}

export function GraphControls({
    zoom,
    onZoomIn,
    onZoomOut,
    onReset,
    onZoomChange,
    className
}: GraphControlsProps) {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={onZoomOut}
                aria-label="Zoom out"
            >
                <MinusIcon className="w-4 h-4" />
            </Button>
            
            <Slider
                value={[zoom]}
                onValueChange={([value]) => onZoomChange(value)}
                min={0.1}
                max={2}
                step={0.1}
                className="w-32"
            />
            
            <Button
                variant="outline"
                size="sm"
                onClick={onZoomIn}
                aria-label="Zoom in"
            >
                <PlusIcon className="w-4 h-4" />
            </Button>
            
            <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                aria-label="Reset view"
            >
                <RotateIcon className="w-4 h-4" />
            </Button>
        </div>
    );
} 