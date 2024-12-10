'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { NotionClient } from '@/lib/notion';
import type { WorkspaceItem } from '@/types/workspace';
import { PageObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Session } from 'next-auth';

interface CustomSession extends Session {
    id?: string;
}

interface SyncState {
    isLoading: boolean;
    isError: boolean;
    lastSynced: Date | null;
}

export function useWorkspaceSync() {
    const { data: session } = useSession() as { data: CustomSession | null };
    const [items, setItems] = useState<WorkspaceItem[]>([]);
    const [syncState, setSyncState] = useState<SyncState>({
        isLoading: true,
        isError: false,
        lastSynced: null,
    });

    const fetchWorkspaceData = useCallback(async () => {
        if (!session) return;

        try {
            setSyncState(prev => ({ ...prev, isLoading: true, isError: false }));
            const notion = new NotionClient(session.accessToken!);
            
            // Fetch pages and databases in parallel
            const [pages, databases] = await Promise.all([
                notion.getPages(),
                notion.getDatabases(),
            ]);

            const workspaceItems: WorkspaceItem[] = [
                ...pages
                    .filter((page): page is PageObjectResponse => 'properties' in page)
                    .map((page) => ({
                        id: page.id,
                        title: ('title' in page.properties && page.properties.title.type === 'title') 
                            ? page.properties.title.title[0]?.plain_text 
                            : 'Untitled',
                        type: 'page' as const,
                        parentId: page.parent.type === 'page_id' ? page.parent.page_id : null,
                        updatedAt: page.last_edited_time,
                        createdAt: page.created_time,
                    })),
                ...databases
                    .filter((db): db is DatabaseObjectResponse => 'title' in db)
                    .map((db) => ({
                        id: db.id,
                        title: db.title[0]?.plain_text || 'Untitled Database',
                        type: 'database' as const,
                        parentId: db.parent.type === 'page_id' ? db.parent.page_id : null,
                        updatedAt: db.last_edited_time,
                        createdAt: db.created_time,
                    })),
            ];

            setItems(workspaceItems);
            setSyncState({
                isLoading: false,
                isError: false,
                lastSynced: new Date(),
            });
        } catch (error) {
            console.error('Failed to sync workspace:', error);
            setSyncState(prev => ({
                ...prev,
                isLoading: false,
                isError: true,
            }));
        }
    }, [session]);

    // Initial fetch
    useEffect(() => {
        fetchWorkspaceData();
    }, [fetchWorkspaceData]);

    // Set up real-time updates
    useEffect(() => {
        if (!session) return;

        const eventSource = new EventSource(`/api/workspace/events?sessionId=${session?.id}`);
        
        eventSource.onmessage = (event) => {
            const update = JSON.parse(event.data);
            setItems(prev => {
                const index = prev.findIndex(item => item.id === update.id);
                if (index === -1) {
                    return [...prev, update];
                }
                const newItems = [...prev];
                newItems[index] = update;
                return newItems;
            });
        };

        return () => {
            eventSource.close();
        };
    }, [session]);

    return {
        items,
        syncState,
        refresh: fetchWorkspaceData,
    };
} 