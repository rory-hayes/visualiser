'use client';

import { useCallback, useReducer, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { FilterState, FilterCriteria, FilterHistoryEntry } from '@/types/filters';
import type { WorkspaceItem } from '@/types/workspace';
import type { SortConfig } from '@/components/filters/types';

type FilterAction =
    | { type: 'SET_CRITERIA'; payload: FilterCriteria }
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'SET_SORT'; payload: SortConfig }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'CLEAR' };

const MAX_HISTORY = 10;

function createHistoryEntry(state: FilterState['current']): FilterHistoryEntry {
    return {
        id: nanoid(),
        timestamp: new Date(),
        ...state,
    };
}

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_CRITERIA': {
            const newState = {
                ...state,
                current: {
                    ...state.current,
                    criteria: action.payload,
                },
                history: [
                    createHistoryEntry(state.current),
                    ...state.history.slice(0, MAX_HISTORY - 1),
                ],
                canUndo: true,
                canRedo: false,
            };
            return newState;
        }
        case 'SET_SEARCH':
        case 'SET_SORT': {
            const newState = {
                ...state,
                current: {
                    ...state.current,
                    [action.type === 'SET_SEARCH' ? 'search' : 'sort']: action.payload,
                },
                history: [
                    createHistoryEntry(state.current),
                    ...state.history.slice(0, MAX_HISTORY - 1),
                ],
                canUndo: true,
                canRedo: false,
            };
            return newState;
        }
        case 'UNDO': {
            if (!state.canUndo || state.history.length === 0) return state;
            const [lastEntry, ...remainingHistory] = state.history;
            return {
                current: {
                    criteria: lastEntry.criteria,
                    search: lastEntry.search,
                    sort: lastEntry.sort,
                },
                history: remainingHistory,
                canUndo: remainingHistory.length > 0,
                canRedo: true,
            };
        }
        case 'REDO': {
            // Implementation depends on how you want to handle redo
            return state;
        }
        case 'CLEAR': {
            return {
                current: {
                    criteria: {},
                    search: '',
                    sort: { type: 'name', direction: 'asc' },
                },
                history: [],
                canUndo: false,
                canRedo: false,
            };
        }
        default:
            return state;
    }
}

export function useAdvancedFilter(items: WorkspaceItem[]) {
    const initialState: FilterState = {
        current: {
            criteria: {
                type: 'all'
            },
            search: '',
            sort: { type: 'name', direction: 'asc' },
        },
        history: [],
        canUndo: false,
        canRedo: false
    };

    const [state, dispatch] = useReducer(filterReducer, initialState);

    // Load saved filters from localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem('workspace-filters');
        if (savedFilters) {
            const { criteria, search, sort } = JSON.parse(savedFilters);
            dispatch({ type: 'SET_CRITERIA', payload: criteria });
            dispatch({ type: 'SET_SEARCH', payload: search });
            dispatch({ type: 'SET_SORT', payload: sort });
        }
    }, []);

    // Save filters to localStorage
    useEffect(() => {
        localStorage.setItem('workspace-filters', JSON.stringify(state.current));
    }, [state.current]);

    const filteredItems = useCallback(() => {
        let result = [...items];

        // Apply criteria filters
        if (state.current.criteria.type && state.current.criteria.type !== 'all') {
            result = result.filter(item => {
                switch (state.current.criteria.type) {
                    case 'pages':
                        return item.type === 'page';
                    case 'databases':
                        return item.type === 'database';
                    default:
                        return true;
                }
            });
        }

        if (state.current.criteria.level === 'root') {
            result = result.filter(item => !item.parentId);
        } else if (state.current.criteria.level === 'nested') {
            result = result.filter(item => item.parentId);
        }

        if (state.current.criteria.dateRange) {
            const { start, end } = state.current.criteria.dateRange;
            result = result.filter(item => {
                const updatedAt = new Date(item.updatedAt!);
                return updatedAt >= start && updatedAt <= end;
            });
        }

        // Apply search filter
        if (state.current.search) {
            const searchLower = state.current.search.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            const { type, direction } = state.current.sort;
            let comparison = 0;

            switch (type) {
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'updated':
                    comparison = new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime();
                    break;
                case 'created':
                    comparison = new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
                    break;
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [items, state.current]);

    return {
        filters: state.current,
        filteredItems: filteredItems(),
        setFilter: (criteria: FilterCriteria) => dispatch({ type: 'SET_CRITERIA', payload: criteria }),
        setSearch: (search: string) => dispatch({ type: 'SET_SEARCH', payload: search }),
        setSort: (sort: SortConfig) => dispatch({ type: 'SET_SORT', payload: sort }),
        undo: () => dispatch({ type: 'UNDO' }),
        redo: () => dispatch({ type: 'REDO' }),
        clear: () => dispatch({ type: 'CLEAR' }),
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        history: state.history,
        onHistoryRestore: () => {
            // Implement history restoration logic
        },
    };
} 