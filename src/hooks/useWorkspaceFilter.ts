'use client';

import * as React from 'react';
import type { WorkspaceItem, FilterType, SortConfig } from '@/types/workspace';

interface FilterState {
    filter: FilterType;
    sort: SortConfig;
    search: string;
}

function getDate(date: Date | string | undefined): Date {
    if (!date) return new Date(0);
    return typeof date === 'string' ? new Date(date) : date;
}

export function useWorkspaceFilter(items: WorkspaceItem[]) {
    const [state, setState] = React.useState<FilterState>({
        filter: 'all',
        sort: {
            type: 'name',
            direction: 'asc',
        },
        search: '',
    });

    const filteredItems = React.useMemo(() => {
        let result = [...items];

        // Apply type filter
        if (state.filter !== 'all') {
            result = result.filter(item => {
                if (state.filter === 'root') return !item.parentId;
                return item.type === state.filter.slice(0, -1); // Remove 's' from 'pages'/'databases'
            });
        }

        // Apply search
        if (state.search) {
            const searchLower = state.search.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (state.sort.type) {
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'updated':
                    comparison = getDate(a.updatedAt).getTime() - getDate(b.updatedAt).getTime();
                    break;
                case 'created':
                    comparison = getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime();
                    break;
            }
            return state.sort.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [items, state]);

    const setFilter = React.useCallback((filter: FilterType) => {
        setState(prev => ({ ...prev, filter }));
    }, []);

    const setSort = React.useCallback((sort: SortConfig) => {
        setState(prev => ({ ...prev, sort }));
    }, []);

    const setSearch = React.useCallback((search: string) => {
        setState(prev => ({ ...prev, search }));
    }, []);

    return {
        items: filteredItems,
        filter: state.filter,
        sort: state.sort,
        search: state.search,
        setFilter,
        setSort,
        setSearch,
    };
} 