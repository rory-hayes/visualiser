'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { DateRangePicker } from './DateRangePicker';
import { StatusFilter } from './StatusFilter';
import { FilterHistory } from './FilterHistory';
import type { FilterCriteria, FilterHistoryEntry, DateRange } from '@/types/filters';

interface FilterPanelProps {
    criteria: FilterCriteria;
    onCriteriaChange: (criteria: FilterCriteria) => void;
    history: FilterHistoryEntry[];
    onHistoryRestore: (entry: FilterHistoryEntry) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function FilterPanel({
    criteria,
    onCriteriaChange,
    history,
    onHistoryRestore,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: FilterPanelProps) {
    const handleDateRangeChange = (dateRange: DateRange | null) => {
        onCriteriaChange({ 
            ...criteria, 
            dateRange: dateRange || undefined 
        });
    };

    const handleStatusChange = (status: FilterCriteria['status']) => {
        onCriteriaChange({
            ...criteria,
            status: status || 'all'
        });
    };

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div>
                    <h3 className="mb-2 text-sm font-medium">Date Range</h3>
                    <DateRangePicker
                        value={criteria.dateRange}
                        onChange={handleDateRangeChange}
                    />
                </div>
                <div>
                    <h3 className="mb-2 text-sm font-medium">Status</h3>
                    <StatusFilter
                        value={criteria.status || 'all'}
                        onChange={handleStatusChange}
                    />
                </div>
                <div>
                    <h3 className="mb-2 text-sm font-medium">Filter History</h3>
                    <FilterHistory
                        history={history}
                        onRestore={onHistoryRestore}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </div>
            </div>
        </Card>
    );
} 