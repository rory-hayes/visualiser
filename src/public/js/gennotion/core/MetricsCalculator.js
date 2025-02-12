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

            // Create Notion entry if credentials are available
            if (workspaceId) {
                await this.notionService.createNotionEntry(workspaceId, combinedMetrics);
            }

            return combinedMetrics;

        } catch (error) {
            console.error('Error calculating metrics:', error);
            throw error;
        }
    }
} 