import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useWorkspaceEvents() {
    const { data: session } = useSession();
    const { refresh } = useWorkspace();

    useEffect(() => {
        if (!session?.user?.id) return;

        const eventSource = new EventSource(`/api/workspace/events?sessionId=${session.user.id}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Handle different event types
            switch (data.type) {
                case 'update':
                    refresh();
                    break;
                // Add other event type handlers
            }
        };

        return () => {
            eventSource.close();
        };
    }, [session?.user?.id, refresh]);
} 