import { useQuery } from '@tanstack/react-query';
import { captureException } from '@/utils/sentry';

interface PropertyUsage {
    name: string;
    count: number;
}

interface Activity {
    id: string;
    name: string;
    type: 'page' | 'database';
    action: 'created' | 'updated';
    date: string;
}

interface WorkspaceAnalytics {
    totalPages: number;
    totalDatabases: number;
    mostUsedProperties: PropertyUsage[];
    recentActivity: Activity[];
    lastSynced: string;
}

async function fetchAnalytics(): Promise<WorkspaceAnalytics> {
    const response = await fetch('/api/notion/analytics');
    if (!response.ok) {
        throw new Error('Failed to fetch analytics');
    }
    return response.json();
}

export function useWorkspaceAnalytics() {
    return useQuery({
        queryKey: ['workspace-analytics'],
        queryFn: fetchAnalytics,
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        onError: (error) => {
            captureException(error, {
                context: 'useWorkspaceAnalytics'
            });
        }
    });
} 