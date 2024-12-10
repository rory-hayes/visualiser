'use client';

import { Select } from '@/components/ui/Select';

interface ContentFiltersProps {
    type: 'page' | 'database';
    onFilterChange: (filter: string) => void;
}

export function ContentFilters({ type, onFilterChange }: ContentFiltersProps) {
    const options = [
        { value: 'all', label: 'All' },
        { value: 'root', label: 'Root Level' },
        { value: 'nested', label: 'Nested' },
        ...(type === 'page' ? [
            { value: 'with-children', label: 'With Children' },
            { value: 'no-children', label: 'No Children' },
        ] : []),
    ];

    return (
        <Select
            options={options}
            placeholder="Filter by..."
            onChange={(value) => onFilterChange(value)}
            className="w-40"
        />
    );
} 