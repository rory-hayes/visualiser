import { Client } from '@notionhq/client';
import { captureException } from './sentry';

export class NotionService {
    private client: Client;

    constructor() {
        this.client = new Client({
            auth: process.env.NOTION_TOKEN,
        });
    }

    async getWorkspaceStructure() {
        try {
            const [databases, pages] = await Promise.all([
                this.client.search({
                    filter: { property: 'object', value: 'database' }
                }),
                this.client.search({
                    filter: { property: 'object', value: 'page' }
                })
            ]);

            return this.transformToGraphData(databases.results, pages.results);
        } catch (error) {
            captureException(error);
            throw new Error('Failed to fetch workspace structure');
        }
    }

    private transformToGraphData(databases: any[], pages: any[]) {
        const nodes = [
            { id: 'workspace', name: 'Workspace', type: 'workspace' as const },
            ...databases.map(db => ({
                id: db.id,
                name: db.title?.[0]?.plain_text || 'Untitled',
                type: 'database' as const,
                properties: db.properties
            })),
            ...pages.map(page => ({
                id: page.id,
                name: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
                type: 'page' as const,
                parent: page.parent
            }))
        ];

        const links = [
            ...databases.map(db => ({
                source: 'workspace',
                target: db.id,
                type: 'contains'
            })),
            ...pages.map(page => ({
                source: page.parent?.type === 'database_id' ? page.parent.database_id : 'workspace',
                target: page.id,
                type: page.parent?.type === 'database_id' ? 'entry' : 'contains'
            }))
        ];

        return { nodes, links };
    }
}

export const notionService = new NotionService(); 