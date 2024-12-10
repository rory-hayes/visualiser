import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface WorkspaceData {
    pages: Array<{
        id: string;
        title: string;
        type: string;
        parentId: string | null;
    }>;
    databases: Array<{
        id: string;
        title: string;
        parentId: string | null;
    }>;
    lastSynced: string;
}

async function fetchWorkspace(): Promise<WorkspaceData> {
    const response = await fetch('/api/workspace');
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch workspace');
    }

    return response.json();
}

export function useWorkspace() {
    return useQuery({
        queryKey: ['workspace'],
        queryFn: fetchWorkspace,
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        onError: (error) => {
            logger.error('Failed to fetch workspace', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });
} 