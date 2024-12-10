'use client';

import React, { createContext, useContext, useReducer } from 'react';
import type { FilterType, SortConfig, FilterCriteria, FilterState } from '@/types/filters';
import type { WorkspaceItem } from '@/types/workspace';

interface FilterContextType {
    items: WorkspaceItem[];
    filter: FilterType;
    sort: SortConfig;
    search: string;
    criteria: FilterCriteria;
    setFilter: (filter: FilterType) => void;
    setSort: (sort: SortConfig) => void;
    setSearch: (search: string) => void;
    setCriteria: (criteria: FilterCriteria) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

type FilterAction = 
    | { type: 'SET_FILTER'; payload: FilterType }
    | { type: 'SET_SORT'; payload: SortConfig }
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'SET_CRITERIA'; payload: FilterCriteria };

const initialState: FilterState = {
    current: {
        criteria: {
            type: 'all',
            status: 'all'
        },
        search: '',
        sort: {
            type: 'name',
            direction: 'asc'
        }
    },
    history: [],
    canUndo: false,
    canRedo: false
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_FILTER':
            return {
                ...state,
                current: {
                    ...state.current,
                    criteria: {
                        ...state.current.criteria,
                        type: action.payload
                    }
                }
            };
        case 'SET_SORT':
            return {
                ...state,
                current: {
                    ...state.current,
                    sort: action.payload
                }
            };
        case 'SET_SEARCH':
            return {
                ...state,
                current: {
                    ...state.current,
                    search: action.payload
                }
            };
        case 'SET_CRITERIA':
            return {
                ...state,
                current: {
                    ...state.current,
                    criteria: action.payload
                }
            };
        default:
            return state;
    }
}

export function FilterProvider({ children, initialItems = [] }: { children: React.ReactNode; initialItems?: WorkspaceItem[] }) {
    const [state, dispatch] = useReducer(filterReducer, initialState);
    const [items] = React.useState(initialItems);

    const value = {
        items,
        filter: state.current.criteria.type,
        sort: state.current.sort,
        search: state.current.search,
        criteria: state.current.criteria,
        setFilter: (filter: FilterType) => dispatch({ type: 'SET_FILTER', payload: filter }),
        setSort: (sort: SortConfig) => dispatch({ type: 'SET_SORT', payload: sort }),
        setSearch: (search: string) => dispatch({ type: 'SET_SEARCH', payload: search }),
        setCriteria: (criteria: FilterCriteria) => dispatch({ type: 'SET_CRITERIA', payload: criteria })
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilterContext() {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilterContext must be used within a FilterProvider');
    }
    return context;
} 