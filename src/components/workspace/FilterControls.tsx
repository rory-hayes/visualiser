'use client';

import React from 'react';
import { SelectField } from '@/components/ui/SelectField';
import type { FilterType, SortConfig } from '@/types/filters';

interface FilterControlsProps {
    filter: FilterType;
    sort: SortConfig;
    onFilterChange: (filter: FilterType) => void;
    onSortChange: (sort: SortConfig) => void;
    className?: string;
}

interface SelectOption {
    value: string;
    label: string;
}

const filterOptions: SelectOption[] = [
    { value: 'all', label: 'All Items' },
    { value: 'pages', label: 'Pages Only' },
    { value: 'databases', label: 'Databases Only' },
    { value: 'root', label: 'Root Level' },
];

const sortOptions: SelectOption[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'updated-desc', label: 'Recently Updated' },
    { value: 'updated-asc', label: 'Oldest Updated' },
    { value: 'created-desc', label: 'Recently Created' },
    { value: 'created-asc', label: 'Oldest Created' },
];

export function FilterControls({
    filter,
    sort,
    onFilterChange,
    onSortChange,
    className,
}: FilterControlsProps) {
    const handleSortChange = (value: string) => {
        const [type, direction] = value.split('-') as [SortConfig['type'], SortConfig['direction']];
        onSortChange({ type, direction });
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <SelectField
                options={filterOptions}
                value={filter}
                onChange={(value) => onFilterChange(value as FilterType)}
                aria-label="Filter items"
            />
            <SelectField
                options={sortOptions}
                value={`${sort.type}-${sort.direction}`}
                onChange={handleSortChange}
                aria-label="Sort items"
            />
        </div>
    );
} 