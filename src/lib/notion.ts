import { Client } from '@notionhq/client';

export class NotionClient {
    private client: Client;
    private cache: Map<string, any>;

    constructor(accessToken: string) {
        this.client = new Client({ auth: accessToken });
        this.cache = new Map();
    }

    private getCacheKey(method: string, params: any): string {
        return `${method}:${JSON.stringify(params)}`;
    }

    private async cachedRequest<T>(
        method: string,
        requestFn: () => Promise<T>,
        ttl: number = 5 * 60 * 1000 // 5 minutes default
    ): Promise<T> {
        const cacheKey = this.getCacheKey(method, requestFn);
        const cached = this.cache.get(cacheKey);

        if (cached && cached.timestamp > Date.now() - ttl) {
            return cached.data;
        }

        const data = await requestFn();
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        });

        return data;
    }

    getPages = async () => {
        return this.cachedRequest('getPages', async () => {
            const response = await this.client.search({
                filter: { property: 'object', value: 'page' },
            });
            return response.results;
        });
    };

    getDatabases = async () => {
        return this.cachedRequest('getDatabases', async () => {
            const response = await this.client.search({
                filter: { property: 'object', value: 'database' },
            });
            return response.results;
        });
    };

    getPage = async (pageId: string) => {
        return this.cachedRequest(`getPage:${pageId}`, async () => {
            return await this.client.pages.retrieve({ page_id: pageId });
        });
    };

    getDatabase = async (databaseId: string) => {
        return this.cachedRequest(`getDatabase:${databaseId}`, async () => {
            return await this.client.databases.retrieve({ database_id: databaseId });
        });
    };
} 