'use client';

import React, { createContext, useContext } from 'react';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';
import type { WorkspaceItem } from '@/types/workspace';

interface WorkspaceContextType {
    items: WorkspaceItem[];
    isLoading: boolean;
    isError: boolean;
    lastSynced: Date | null;
    refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { items, syncState, refresh } = useWorkspaceSync();

    return (
        <WorkspaceContext.Provider
            value={{
                items,
                isLoading: syncState.isLoading,
                isError: syncState.isError,
                lastSynced: syncState.lastSynced,
                refresh,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
} 