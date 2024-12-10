'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/utils/cn';

interface SliderProps {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
}

export function Slider({
    value,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    className
}: SliderProps) {
    const handleValueChange = React.useCallback(
        (values: number[]) => onValueChange(values[0]),
        [onValueChange]
    );

    return (
        <SliderPrimitive.Root
            className={cn('relative flex w-full touch-none select-none items-center', className)}
            value={[value]}
            onValueChange={handleValueChange}
            min={min}
            max={max}
            step={step}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-gray-200 dark:bg-gray-800">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary-600 dark:bg-primary-400" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary-600 bg-white dark:border-primary-400 dark:bg-gray-900" />
        </SliderPrimitive.Root>
    );
} 