import { NotionFormatter } from '../core/formatters/NotionFormatter.js';

export class NotionService {
    constructor(notionClient, databaseId) {
        this.notion = notionClient;
        this.databaseId = databaseId;
        this.formatter = new NotionFormatter();
        this.requestTracker = new Map(); // Track requests by workspaceId and timestamp
    }

    async createNotionEntry(workspaceId, metrics) {
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            if (!this.databaseId) {
                throw new Error('Notion database ID is not configured');
            }

            // Track this request
            const requestKey = `${workspaceId}-${metrics.timestamp || new Date().toISOString()}`;
            if (this.requestTracker.has(requestKey)) {
                console.warn('Duplicate Notion entry creation detected:', {
                    workspaceId,
                    timestamp: metrics.timestamp,
                    previousRequest: this.requestTracker.get(requestKey)
                });
                return this.requestTracker.get(requestKey);
            }

            console.log('Creating Notion entry for workspace:', workspaceId);
            console.log('Available metrics:', Object.keys(metrics));
            
            // Create page content
            const blocks = this.formatter.createMetricsBlocks(metrics);
            console.log('Created blocks for Notion page:', blocks.length);

            // Create the page in Notion
            const response = await this.notion.pages.create({
                parent: {
                    database_id: this.databaseId,
                    type: 'database_id'
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: `Workspace Analysis Report - ${new Date().toLocaleDateString()}`
                                }
                            }
                        ]
                    },
                    "Workspace ID": {
                        rich_text: [
                            {
                                text: {
                                    content: workspaceId
                                }
                            }
                        ]
                    },
                    Status: {
                        rich_text: [
                            {
                                text: {
                                    content: "Generated"
                                }
                            }
                        ]
                    },
                    "Analysis Date": {
                        date: {
                            start: new Date().toISOString()
                        }
                    }
                },
                children: blocks
            });

            // Store the successful request
            this.requestTracker.set(requestKey, response.id);

            console.log('Successfully created Notion page:', response.id);
            console.log('Page URL:', `https://notion.so/${response.id.replace(/-/g, '')}`);
            return response.id;

        } catch (error) {
            console.error('Error in createNotionEntry:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                details: error.details
            });
            throw error;
        }
    }
} 