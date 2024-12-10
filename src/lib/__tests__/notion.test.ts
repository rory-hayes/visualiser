import { NotionClient } from '../notion';
import { Client } from '@notionhq/client';

vi.mock('@notionhq/client', () => ({
    Client: vi.fn(),
}));

describe('NotionClient', () => {
    const mockAccessToken = 'test-token';
    let notionClient: NotionClient;
    let mockSearch: jest.Mock;

    beforeEach(() => {
        mockSearch = vi.fn();
        (Client as jest.Mock).mockImplementation(() => ({
            search: mockSearch,
        }));
        notionClient = new NotionClient(mockAccessToken);
    });

    describe('getWorkspaceStructure', () => {
        const mockPages = [
            {
                id: 'page1',
                object: 'page',
                title: 'Test Page',
                parent: { type: 'workspace', workspace: true },
            },
            {
                id: 'page2',
                object: 'page',
                title: 'Child Page',
                parent: { type: 'page', page_id: 'page1' },
            },
        ];

        const mockDatabases = [
            {
                id: 'db1',
                object: 'database',
                title: [{ text: { content: 'Test Database' } }],
                parent: { type: 'page', page_id: 'page1' },
            },
        ];

        beforeEach(() => {
            mockSearch
                .mockResolvedValueOnce({ results: mockPages, next_cursor: null })
                .mockResolvedValueOnce({ results: mockDatabases, next_cursor: null });
        });

        it('fetches and transforms workspace structure', async () => {
            const result = await notionClient.getWorkspaceStructure();

            expect(result.pages).toHaveLength(2);
            expect(result.databases).toHaveLength(1);

            expect(result.pages[0]).toEqual({
                pageId: 'page1',
                title: 'Test Page',
                type: 'page',
                parentId: null,
            });

            expect(result.databases[0]).toEqual({
                databaseId: 'db1',
                title: 'Test Database',
                parentId: 'page1',
            });
        });

        it('handles pagination', async () => {
            mockSearch
                .mockResolvedValueOnce({ results: [mockPages[0]], next_cursor: 'cursor1' })
                .mockResolvedValueOnce({ results: [mockPages[1]], next_cursor: null })
                .mockResolvedValueOnce({ results: mockDatabases, next_cursor: null });

            const result = await notionClient.getWorkspaceStructure();

            expect(result.pages).toHaveLength(2);
            expect(mockSearch).toHaveBeenCalledTimes(3);
        });

        it('handles errors gracefully', async () => {
            mockSearch.mockRejectedValueOnce(new Error('API Error'));

            await expect(notionClient.getWorkspaceStructure()).rejects.toThrow('Failed to fetch workspace structure');
        });

        it('handles missing titles', async () => {
            mockSearch
                .mockResolvedValueOnce({
                    results: [{ ...mockPages[0], title: undefined }],
                    next_cursor: null,
                })
                .mockResolvedValueOnce({
                    results: [{ ...mockDatabases[0], title: [] }],
                    next_cursor: null,
                });

            const result = await notionClient.getWorkspaceStructure();

            expect(result.pages[0].title).toBe('Untitled');
            expect(result.databases[0].title).toBe('Untitled Database');
        });
    });
}); 