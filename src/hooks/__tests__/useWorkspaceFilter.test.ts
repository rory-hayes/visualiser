import { renderHook, act } from '@testing-library/react';
import { useWorkspaceFilter } from '../useWorkspaceFilter';
import type { WorkspaceItem } from '@/types/workspace';

describe('useWorkspaceFilter', () => {
    const mockItems: WorkspaceItem[] = [
        {
            id: '1',
            title: 'Test Page',
            type: 'page' as const,
            parentId: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
        {
            id: '2',
            title: 'Test Database',
            type: 'database' as const,
            parentId: '1',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
    ];

    it('initializes with default state', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        expect(result.current.items).toEqual(mockItems);
        expect(result.current.filter).toBe('all');
        expect(result.current.sort.type).toBe('name');
        expect(result.current.sort.direction).toBe('asc');
        expect(result.current.search).toBe('');
    });

    it('filters by type', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        act(() => {
            result.current.setFilter('pages');
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].type).toBe('page');
    });

    it('filters by search term', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        act(() => {
            result.current.setSearch('database');
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].title).toContain('Database');
    });

    it('sorts items by name', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        act(() => {
            result.current.setSort({ type: 'name', direction: 'desc' });
        });

        expect(result.current.items[0].title).toBe('Test Page');
        expect(result.current.items[1].title).toBe('Test Database');
    });

    it('sorts items by date', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        act(() => {
            result.current.setSort({ type: 'updated', direction: 'desc' });
        });

        expect(result.current.items).toBeDefined();
        expect(result.current.sort.type).toBe('updated');
    });

    it('combines filters and sorts', () => {
        const { result } = renderHook(() => useWorkspaceFilter(mockItems));

        act(() => {
            result.current.setFilter('pages');
            result.current.setSearch('test');
            result.current.setSort({ type: 'name', direction: 'asc' });
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].type).toBe('page');
        expect(result.current.items[0].title).toContain('Test');
    });
}); 