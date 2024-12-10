import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@/utils/sentry';

interface NotificationSettings {
    emailNotifications: boolean;
    syncNotifications: boolean;
    weeklyDigest: boolean;
}

async function fetchNotificationSettings(): Promise<NotificationSettings> {
    const response = await fetch('/api/settings/notifications');
    if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
    }
    return response.json();
}

async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        throw new Error('Failed to update notification settings');
    }
    return response.json();
}

export function useNotificationSettings() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['notification-settings'],
        queryFn: fetchNotificationSettings,
        onError: (error) => {
            captureException(error, {
                context: 'useNotificationSettings'
            });
        }
    });

    const mutation = useMutation({
        mutationFn: updateNotificationSettings,
        onSuccess: (data) => {
            queryClient.setQueryData(['notification-settings'], data);
        },
        onError: (error) => {
            captureException(error, {
                context: 'useNotificationSettings.update'
            });
        }
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error,
        updateSettings: mutation.mutate,
        isUpdating: mutation.isPending,
    };
} 