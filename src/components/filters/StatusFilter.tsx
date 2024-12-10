'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import type { FilterCriteria } from '@/types/filters';

interface StatusFilterProps {
    value: FilterCriteria['status'];
    onChange: (status: FilterCriteria['status']) => void;
    className?: string;
}

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
] as const;

export function StatusFilter({ value = 'all', onChange, className }: StatusFilterProps) {
    return (
        <Select
            options={statusOptions}
            value={value}
            onChange={onChange}
            className={className}
            aria-label="Filter by status"
        />
    );
} 