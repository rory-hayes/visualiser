'use client';

import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

export type FilterType = 'all' | 'page' | 'database';
export type GroupBy = 'none' | 'type' | 'parent';

interface GraphFiltersProps {
    filter: FilterType;
    groupBy: GroupBy;
    showOrphans: boolean;
    onFilterChange: (filter: FilterType) => void;
    onGroupByChange: (groupBy: GroupBy) => void;
    onShowOrphansChange: (show: boolean) => void;
    className?: string;
}

export function GraphFilters({
    filter,
    groupBy,
    showOrphans,
    onFilterChange,
    onGroupByChange,
    onShowOrphansChange,
    className
}: GraphFiltersProps) {
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show:</span>
                <Select value={filter} onValueChange={onFilterChange}>
                    <SelectTrigger className="w-32">
                        <SelectValue>
                            {filter === 'all' ? 'All Items' : 
                             filter === 'page' ? 'Pages Only' : 
                             'Databases Only'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="page">Pages Only</SelectItem>
                        <SelectItem value="database">Databases Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Group by:</span>
                <Select value={groupBy} onValueChange={onGroupByChange}>
                    <SelectTrigger className="w-32">
                        <SelectValue>
                            {groupBy === 'none' ? 'No Grouping' :
                             groupBy === 'type' ? 'Item Type' :
                             'Parent Page'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Grouping</SelectItem>
                        <SelectItem value="type">Item Type</SelectItem>
                        <SelectItem value="parent">Parent Page</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show orphans:</span>
                <Switch
                    checked={showOrphans}
                    onCheckedChange={onShowOrphansChange}
                />
            </div>
        </div>
    );
} 