import { StructureMetrics } from './StructureMetrics.js';
import { UsageMetrics } from './UsageMetrics.js';
import { GrowthMetrics } from './GrowthMetrics.js';
import { ROIMetrics } from './ROIMetrics.js';
import { BaseMetrics } from './BaseMetrics.js';
import { NotionService } from '../../services/NotionService.js';
import { Client } from '@notionhq/client';

export class MetricsCalculator extends BaseMetrics {
    constructor(notionApiKey, notionDatabaseId) {
        super();
        if (!notionApiKey || !notionDatabaseId) {
            throw new Error('Missing required Notion credentials: notionApiKey and notionDatabaseId must be provided');
        }

        // Initialize specialized calculators
        this.structureMetrics = new StructureMetrics();
        this.usageMetrics = new UsageMetrics();
        this.growthMetrics = new GrowthMetrics();
        this.roiMetrics = new ROIMetrics();

        // Initialize Notion service
        const notionClient = new Client({ auth: notionApiKey });
        this.notionService = new NotionService(notionClient, notionDatabaseId);
    }

    async calculateAllMetrics(dataframe_2, dataframe_3, dataframe_5, workspaceId) {
        try {
            // Validate input data
            this.validateData(dataframe_2, dataframe_3, dataframe_5);

            // Calculate metrics from each specialized calculator
            const structureMetrics = this.structureMetrics.calculateStructureMetrics(dataframe_2, dataframe_3);
            const usageMetrics = this.usageMetrics.calculateUsageMetrics(dataframe_3, dataframe_5);
            const growthMetrics = this.growthMetrics.calculateGrowthMetrics(dataframe_2, dataframe_3, dataframe_5);
            const roiMetrics = this.roiMetrics.calculateROIMetrics(dataframe_3, dataframe_5);

            // Combine all metrics
            const combinedMetrics = {
                workspaceId,
                timestamp: new Date().toISOString(),
                ...structureMetrics,
                ...usageMetrics,
                ...growthMetrics,
                ...roiMetrics
            };

            // Create Notion entry
            await this.notionService.createNotionEntry(workspaceId, combinedMetrics);

            return combinedMetrics;

        } catch (error) {
            console.error('Error calculating metrics:', error);
            throw error;
        }
    }

    async createNotionEntry(workspaceId, metrics) {
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            if (!this.notionDatabaseId) {
                throw new Error('Notion database ID is not configured');
            }

            // Create page content
            const blocks = this.createMetricsBlocks(metrics);

            // Create the page in Notion
            const response = await this.notion.pages.create({
                parent: {
                    database_id: this.notionDatabaseId,
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
                        select: {
                            name: "Generated"
                        }
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

    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: 'Structure & Evolution Metrics',
                metrics: [
                    `Total Pages: ${metrics.totalPages}`,
                    `Max Depth: ${metrics.maxDepth}`,
                    `Average Depth: ${this.formatDecimal(metrics.avgDepth)}`,
                    `Deep Pages Count: ${metrics.deepPagesCount}`,
                    `Orphaned Blocks: ${metrics.orphanedBlocks}`,
                    `Collections Count: ${metrics.collectionsCount}`,
                    `Content Diversity Score: ${this.formatPercentage(metrics.contentDiversityScore)}`,
                    `Structure Quality Index: ${this.formatPercentage(metrics.structureQualityIndex)}`
                ]
            },
            {
                title: 'Usage & Team Metrics',
                metrics: [
                    `Total Members: ${metrics.totalMembers}`,
                    `Active Members: ${metrics.activeMembers}`,
                    `Daily Active Users: ${metrics.dailyActiveUsers}`,
                    `Weekly Active Users: ${metrics.weeklyActiveUsers}`,
                    `Monthly Active Users: ${metrics.monthlyActiveUsers}`,
                    `Team Adoption Score: ${this.formatPercentage(metrics.teamAdoptionScore)}`,
                    `Engagement Score: ${this.formatPercentage(metrics.engagementScore)}`
                ]
            },
            {
                title: 'Growth & Projections',
                metrics: [
                    `Monthly Member Growth Rate: ${this.formatPercentage(metrics.monthlyMemberGrowthRate)}`,
                    `Monthly Content Growth Rate: ${this.formatPercentage(metrics.monthlyContentGrowthRate)}`,
                    `Expected Members Next Year: ${Math.round(metrics.expectedMembersNextYear)}`,
                    `Growth Consistency: ${this.formatPercentage(metrics.growthConsistency)}`,
                    `Scaling Readiness Score: ${this.formatPercentage(metrics.scalingReadinessScore)}`
                ]
            },
            {
                title: 'ROI & Cost Analysis',
                metrics: [
                    `Current Plan Cost: ${this.formatCurrency(metrics.currentPlanCost)}/month`,
                    `Enterprise Plan ROI: ${this.formatPercentage(metrics.enterprisePlanROI)}`,
                    `Enterprise Plan Annual Savings: ${this.formatCurrency(metrics.enterprisePlanSavings)}`,
                    `Enterprise + AI ROI: ${this.formatPercentage(metrics.enterpriseAIROI)}`,
                    `Enterprise + AI Annual Savings: ${this.formatCurrency(metrics.enterpriseAISavings)}`,
                    `Projected Time Savings: ${this.formatDecimal(metrics.projectedTimeSavings.hoursPerMember)} hours/member/month`,
                    `Automation Potential: ${this.formatPercentage(metrics.automationPotential.score)}`
                ]
            }
        ];

        const blocks = [];

        // Add title
        blocks.push({
            object: 'block',
            type: 'heading_1',
            heading_1: {
                rich_text: [{
                    type: 'text',
                    text: { content: 'Workspace Analysis Report' }
                }]
            }
        });

        // Add sections
        sections.forEach(section => {
            // Add section heading
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [{
                        type: 'text',
                        text: { content: section.title }
                    }]
                }
            });

            // Add metrics as bulleted list
            section.metrics.forEach(metric => {
                blocks.push({
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: metric }
                        }]
                    }
                });
            });

            // Add divider between sections
            blocks.push({
                object: 'block',
                type: 'divider',
                divider: {}
            });
        });

        return blocks;
    }
} 