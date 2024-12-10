'use client';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LayoutType } from '@/hooks/useGraphState';
import { Switch } from '@/components/ui/Switch';

interface GraphControlsProps {
    layout: LayoutType;
    showLabels: boolean;
    onLayoutChange: (layout: LayoutType) => void;
    onToggleLabels: () => void;
    onReset: () => void;
}

export function GraphControls({
    layout,
    showLabels,
    onLayoutChange,
    onToggleLabels,
    onReset,
}: GraphControlsProps) {
    const layoutOptions = [
        { value: 'force', label: 'Force-directed' },
        { value: 'tree', label: 'Tree' },
        { value: 'radial', label: 'Radial' },
    ];

    return (
        <div className="absolute top-4 right-4 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
            <Select
                options={layoutOptions}
                value={layout}
                onChange={(value) => onLayoutChange(value as LayoutType)}
                className="w-40"
                aria-label="Change layout"
            />
            <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Labels</span>
                <Switch
                    checked={showLabels}
                    onCheckedChange={onToggleLabels}
                    aria-label="Toggle labels"
                />
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="ml-2"
                aria-label="Reset view"
            >
                Reset
            </Button>
        </div>
    );
} 