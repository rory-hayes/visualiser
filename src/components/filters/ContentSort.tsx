'use client';

import { Select } from '@/components/ui/Select';

interface ContentSortProps {
    onSortChange: (sort: string) => void;
}

export function ContentSort({ onSortChange }: ContentSortProps) {
    const options = [
        { value: 'updated-desc', label: 'Recently Updated' },
        { value: 'updated-asc', label: 'Oldest Updated' },
        { value: 'created-desc', label: 'Recently Created' },
        { value: 'created-asc', label: 'Oldest Created' },
        { value: 'title-asc', label: 'Title A-Z' },
        { value: 'title-desc', label: 'Title Z-A' },
    ];

    return (
        <Select
            options={options}
            placeholder="Sort by..."
            onChange={(value) => onSortChange(value)}
            className="w-40"
        />
    );
} 