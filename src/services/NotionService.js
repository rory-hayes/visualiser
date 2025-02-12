import { Client } from '@notionhq/client';
import { NotionFormatter } from '../core/formatters/NotionFormatter.js';
import { MetricsCalculator } from '../core/metrics/MetricsCalculator.js';
import { TreeVisualizer } from '../core/visualization/TreeVisualizer.js';

export class NotionService {
    constructor(authToken) {
        this.notion = new Client({ auth: authToken });
        this.formatter = new NotionFormatter();
        this.calculator = new MetricsCalculator();
        this.visualizer = new TreeVisualizer();
        this.requestTracker = new Map(); // Track requests by workspaceId and timestamp
    }

    async analyzeWorkspace() {
        try {
            // Fetch workspace data
            const data = await this.fetchWorkspaceData();
            
            // Calculate metrics
            const metrics = await this.calculator.calculateMetrics(data);
            
            // Create visualization
            const visualizationUrl = await this.visualizer.visualizeWorkspace(data);
            if (visualizationUrl) {
                metrics.visualizationUrl = visualizationUrl;
            }

            // Create blocks for the page
            const blocks = await this.formatter.createMetricsBlocks(metrics);

            // Create the page
            const page = await this.notion.pages.create({
                parent: { type: 'page_id', page_id: process.env.NOTION_PAGE_ID },
                properties: {
                    title: [
                        {
                            type: 'text',
                            text: { content: 'Workspace Analysis Report' }
                        }
                    ]
                },
                children: blocks
            });

            return page;
        } catch (error) {
            console.error('Error analyzing workspace:', error);
            throw error;
        }
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