'use client';

import React from 'react';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { FilterBar } from '@/components/workspace/FilterBar';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { WorkspaceList } from '@/components/workspace/WorkspaceList';
import { WorkspaceGraph } from '@/components/workspace/WorkspaceGraph';
import { useAdvancedFilter } from '@/hooks/useAdvancedFilter';

export default function WorkspacePage() {
    const {
        items,
        isLoading,
        isError,
        lastSynced,
        refresh,
    } = useWorkspace();

    const {
        filters,
        filteredItems,
        setFilter,
        setSearch,
        setSort,
        history,
        onHistoryRestore,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useAdvancedFilter(items);

    const [view, setView] = React.useState<'list' | 'graph'>('list');

    if (isError) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Failed to load workspace</h2>
                <button
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <WorkspaceHeader
                view={view}
                onViewChange={setView}
                lastSynced={lastSynced}
                onRefresh={refresh}
            />
            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-9">
                        <FilterBar />
                        {isLoading ? (
                            <div className="mt-8 text-center">Loading workspace...</div>
                        ) : view === 'list' ? (
                            <WorkspaceList
                                items={filteredItems}
                                className="mt-6"
                            />
                        ) : (
                            <WorkspaceGraph
                                items={filteredItems}
                                className="mt-6 h-[600px]"
                            />
                        )}
                    </div>
                    <div className="col-span-3">
                        <FilterPanel
                            criteria={filters.criteria}
                            onCriteriaChange={setFilter}
                            history={history}
                            onHistoryRestore={onHistoryRestore}
                            onUndo={undo}
                            onRedo={redo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
} 