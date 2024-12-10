'use client';

import React from 'react';
import { SearchBar } from './SearchBar';
import { FilterControls } from './FilterControls';
import { useFilterContext } from '@/contexts/FilterContext';

interface FilterBarProps {
    className?: string;
}

export function FilterBar({ className }: FilterBarProps) {
    const { search, setSearch, filter, setFilter, sort, setSort } = useFilterContext();

    return (
        <div className={className}>
            <div className="flex flex-col sm:flex-row gap-4">
                <SearchBar 
                    value={search}
                    onChange={setSearch}
                    className="sm:w-72"
                />
                <FilterControls
                    filter={filter}
                    sort={sort}
                    onFilterChange={setFilter}
                    onSortChange={setSort}
                />
            </div>
        </div>
    );
} 