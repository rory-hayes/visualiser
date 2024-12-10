import { rest } from 'msw';

export const handlers = [
    rest.get('/api/workspace', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                pages: [
                    {
                        id: '1',
                        pageId: 'page1',
                        title: 'Getting Started',
                        type: 'page',
                        parentId: null,
                    },
                ],
                databases: [
                    {
                        id: '2',
                        databaseId: 'db1',
                        title: 'Tasks',
                        parentId: 'page1',
                    },
                ],
            })
        );
    }),

    rest.post('/api/workspace/sync', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                message: 'Workspace synced successfully',
                changes: {
                    pages: { added: 1, total: 1 },
                    databases: { added: 1, total: 1 },
                },
            })
        );
    }),

    rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                },
            })
        );
    }),
]; 