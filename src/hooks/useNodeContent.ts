import { useQuery } from '@tanstack/react-query';
import { captureException } from '@/utils/sentry';

async function fetchNodeContent(nodeId: string, nodeType: string) {
    const response = await fetch(`/api/notion/${nodeType}/${nodeId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch node content');
    }
    return response.json();
}

export function useNodeContent(nodeId: string, nodeType: string) {
    return useQuery({
        queryKey: ['node-content', nodeId],
        queryFn: () => fetchNodeContent(nodeId, nodeType),
        enabled: !!nodeId && (nodeType === 'page' || nodeType === 'database'),
        onError: (error) => {
            captureException(error, {
                context: 'useNodeContent',
                extra: { nodeId, nodeType }
            });
        }
    });
} 