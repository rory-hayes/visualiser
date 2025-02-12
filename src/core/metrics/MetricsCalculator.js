import { StructureMetrics } from './StructureMetrics.js';
import { UsageMetrics } from './UsageMetrics.js';
import { GrowthMetrics } from './GrowthMetrics.js';
import { ROIMetrics } from './ROIMetrics.js';
import { BaseMetrics } from './BaseMetrics.js';
import { NotionService } from '../../services/NotionService.js';
import { Client } from '@notionhq/client';
import { EvolutionMetrics } from './EvolutionMetrics.js';
import { CollaborationPatterns } from './CollaborationPatterns.js';

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
        this.evolutionMetrics = new EvolutionMetrics();
        this.collaborationMetrics = new CollaborationPatterns();

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
            const evolutionMetrics = this.evolutionMetrics.calculateEvolutionMetrics(dataframe_2, dataframe_3, dataframe_5);
            const collaborationMetrics = this.collaborationMetrics.calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5);

            // Calculate growth scenarios
            const growthScenarios = this.calculateGrowthScenarios(dataframe_3, dataframe_5);

            // Combine all metrics
            const combinedMetrics = {
                workspaceId,
                timestamp: new Date().toISOString(),
                ...structureMetrics,
                ...usageMetrics,
                ...growthMetrics,
                ...roiMetrics,
                ...evolutionMetrics,
                ...collaborationMetrics,
                growth_scenarios: growthScenarios
            };

            // Log the metrics being calculated
            console.log('Calculated metrics:', {
                workspaceId,
                metricKeys: Object.keys(combinedMetrics),
                timestamp: combinedMetrics.timestamp
            });

            return combinedMetrics;

        } catch (error) {
            console.error('Error calculating metrics:', error);
            throw error;
        }
    }

    calculateGrowthScenarios(dataframe_3, dataframe_5) {
        const baseRevenue = this.calculateBaseRevenue(dataframe_3, dataframe_5);
        return {
            tenPercent: baseRevenue * 1.1,
            twentyPercent: baseRevenue * 1.2,
            fiftyPercent: baseRevenue * 1.5
        };
    }

    calculateBaseRevenue(dataframe_3, dataframe_5) {
        // Calculate base revenue from current members and plan costs
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const planCost = dataframe_5.PLAN_COST || 0;
        return totalMembers * planCost * 12; // Annual revenue
    }

    validateData(dataframe_2, dataframe_3, dataframe_5) {
        if (!Array.isArray(dataframe_2) || dataframe_2.length === 0) {
            throw new Error('dataframe_2 must be a non-empty array');
        }
        if (!dataframe_3 || typeof dataframe_3 !== 'object') {
            throw new Error('dataframe_3 must be a valid object');
        }
        if (!dataframe_5 || typeof dataframe_5 !== 'object') {
            throw new Error('dataframe_5 must be a valid object');
        }

        // Log the data for debugging
        console.log('Validating data:');
        console.log('dataframe_2 length:', dataframe_2.length);
        console.log('dataframe_3 keys:', Object.keys(dataframe_3));
        console.log('dataframe_5 keys:', Object.keys(dataframe_5));
    }
} 