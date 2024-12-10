import { format } from 'date-fns';

export type FilterType = 'all' | 'pages' | 'databases' | 'root';

export type SortConfig = {
    type: 'name' | 'updated' | 'created';
    direction: 'asc' | 'desc';
};

export interface DateRange {
    start: Date | undefined;
    end: Date | undefined;
}

export function formatDate(date: Date | undefined): string {
    return date ? format(date, 'LLL dd, y') : '';
}

export interface FilterCriteria {
    type: FilterType;
    level?: 'root' | 'nested' | 'all';
    dateRange?: DateRange;
    tags?: string[];
    status?: 'active' | 'archived' | 'all';
    lastModified?: 'today' | 'week' | 'month' | 'all';
}

export interface FilterHistoryEntry {
    id: string;
    timestamp: Date;
    criteria: FilterCriteria;
    search: string;
    sort: SortConfig;
}

export interface FilterState {
    current: {
        criteria: FilterCriteria;
        search: string;
        sort: SortConfig;
    };
    history: FilterHistoryEntry[];
    canUndo: boolean;
    canRedo: boolean;
} 