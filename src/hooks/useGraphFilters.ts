import { useState, useCallback, useMemo } from 'react';
import type { FilterType, GroupBy } from '@/components/workspace/GraphFilters';
import type { WorkspaceItem } from '@/types/workspace';

export function useGraphFilters(items: WorkspaceItem[]) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [showOrphans, setShowOrphans] = useState(true);

    const filteredItems = useMemo(() => {
        let result = items;

        // Apply type filter
        if (filter !== 'all') {
            result = result.filter(item => item.type === filter);
        }

        // Filter orphans if needed
        if (!showOrphans) {
            result = result.filter(item => item.parentId);
        }

        return result;
    }, [items, filter, showOrphans]);

    const groupedItems = useMemo(() => {
        if (groupBy === 'none') return filteredItems;

        const groups = new Map<string, WorkspaceItem[]>();

        filteredItems.forEach(item => {
            const key = groupBy === 'type' ? item.type :
                       groupBy === 'parent' ? (item.parentId || 'root') :
                       'unknown';
            
            const group = groups.get(key) || [];
            group.push(item);
            groups.set(key, group);
        });

        return Array.from(groups.entries()).map(([key, items]) => ({
            id: `group-${key}`,
            type: 'group',
            title: key.charAt(0).toUpperCase() + key.slice(1),
            items
        }));
    }, [filteredItems, groupBy]);

    return {
        filter,
        groupBy,
        showOrphans,
        setFilter,
        setGroupBy,
        setShowOrphans,
        filteredItems,
        groupedItems
    };
} 