import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@/utils/sentry';

interface WorkspaceSettings {
    showLabels: boolean;
    animateTransitions: boolean;
    defaultLayout: 'force' | 'hierarchical' | 'circular';
    theme: 'system' | 'light' | 'dark';
}

async function fetchSettings(): Promise<WorkspaceSettings> {
    const response = await fetch('/api/settings');
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
}

async function updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        throw new Error('Failed to update settings');
    }
    return response.json();
}

export function useWorkspaceSettings() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['workspace-settings'],
        queryFn: fetchSettings,
        onError: (error) => {
            captureException(error, {
                context: 'useWorkspaceSettings',
            });
        },
    });

    const mutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: (newSettings) => {
            queryClient.setQueryData(['workspace-settings'], newSettings);
        },
        onError: (error) => {
            captureException(error, {
                context: 'useWorkspaceSettings.update',
            });
        },
    });

    return {
        data,
        isLoading,
        error,
        updateSettings: mutation.mutate,
        isUpdating: mutation.isPending,
    };
} 