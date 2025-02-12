import { NotionFormatter } from '../core/formatters/NotionFormatter.js';

export class NotionService {
    constructor(notionClient, databaseId) {
        this.notion = notionClient;
        this.databaseId = databaseId;
        this.formatter = new NotionFormatter();
    }

    async createNotionEntry(workspaceId, metrics) {
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            if (!this.databaseId) {
                throw new Error('Notion database ID is not configured');
            }

            // Create page content
            const blocks = this.formatter.createMetricsBlocks(metrics);

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

            console.log('Successfully created Notion page:', response.id);
            return response.id;

        } catch (error) {
            console.error('Error in createNotionEntry:', error);
            throw error;
        }
    }
} 