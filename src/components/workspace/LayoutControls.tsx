'use client';

import React from 'react';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/Select';

export type LayoutType = 'force' | 'radial' | 'hierarchical';

interface LayoutControlsProps {
    layout: LayoutType;
    onLayoutChange: (layout: LayoutType) => void;
    className?: string;
}

export function LayoutControls({ layout, onLayoutChange, className }: LayoutControlsProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-500">Layout:</span>
            <Select value={layout} onValueChange={onLayoutChange}>
                <SelectTrigger className="w-32">
                    <SelectValue>
                        {layout.charAt(0).toUpperCase() + layout.slice(1)}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="force">Force</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
} 