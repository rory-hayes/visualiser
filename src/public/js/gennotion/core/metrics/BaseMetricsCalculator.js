import { StructureMetrics } from './StructureMetrics.js';
import { UsageMetrics } from './UsageMetrics.js';
import { GrowthMetrics } from './GrowthMetrics.js';
import { CollaborationMetrics } from './CollaborationMetrics.js';
import { ContentMetrics } from './ContentMetrics.js';
import { ROIMetrics } from './ROIMetrics.js';
import { VisualizationHelper } from './VisualizationHelper.js';
import { NotionHelper } from './NotionHelper.js';
import { MetricsFormatter } from './MetricsFormatter.js';
import { Client } from '@notionhq/client';
import { SnapshotVisualizer } from '../SnapshotVisualizer.js';

export class MetricsCalculator {
    constructor(notionApiKey, notionDatabaseId) {
        // Constants for calculations
        this.INDUSTRY_AVERAGE_TEAM_SIZE = 8;
        this.RECOMMENDED_INTEGRATIONS = 5;
        this.DEEP_PAGE_THRESHOLD = 5;
        this.BOTTLENECK_THRESHOLD = 10;
        this.SCATTER_THRESHOLD = 0.3;
        this.UNFINDABLE_DEPTH = 4;
        this.MIN_MONTHS_FOR_TRENDS = 3;
        this.MIN_MONTHS_FOR_YOY = 12;
        this.MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
        this.MILLISECONDS_PER_MONTH = 30 * this.MILLISECONDS_PER_DAY;

        // Validate Notion credentials
        if (!notionApiKey || !notionDatabaseId) {
            throw new Error('Missing required Notion credentials: notionApiKey and notionDatabaseId must be provided');
        }

        // Initialize components
        this.notion = new Client({ auth: notionApiKey });
        this.NOTION_DATABASE_ID = notionDatabaseId;
        this.snapshotVisualizer = new SnapshotVisualizer();

        // Initialize metric calculators
        this.structureMetrics = new StructureMetrics(this);
        this.usageMetrics = new UsageMetrics(this);
        this.growthMetrics = new GrowthMetrics(this);
        this.collaborationMetrics = new CollaborationMetrics(this);
        this.contentMetrics = new ContentMetrics(this);
        this.roiMetrics = new ROIMetrics(this);
        this.visualizationHelper = new VisualizationHelper(this);
        this.notionHelper = new NotionHelper(this);
        this.metricsFormatter = new MetricsFormatter();
    }

    async calculateAllMetrics(dataframe_2, dataframe_3, dataframe_5, workspaceId) {
        console.log('DEBUG - calculateAllMetrics workspaceId:', workspaceId);
        console.log('DEBUG - Input data validation:', {
            df2Length: dataframe_2?.length,
            df3Present: !!dataframe_3,
            df5Length: dataframe_5?.length,
            df2Sample: dataframe_2?.[0],
            df3Keys: dataframe_3 ? Object.keys(dataframe_3) : [],
            df5Sample: dataframe_5?.[0]
        });

        // Calculate workspace age first
        const workspaceAge = this.calculateWorkspaceAge(dataframe_2);
        console.log('Calculated workspace age:', workspaceAge);

        console.log('DEBUG - Starting metrics calculations');

        // Calculate all metrics using specialized calculators
        const structureMetrics = this.structureMetrics.calculateStructureMetrics(dataframe_2, dataframe_3);
        const usageMetrics = this.usageMetrics.calculateUsageMetrics(dataframe_3, dataframe_5);
        const growthMetrics = this.growthMetrics.calculateGrowthMetrics(dataframe_3, dataframe_2, dataframe_5);
        const organizationMetrics = this.collaborationMetrics.calculateOrganizationMetrics(dataframe_3, dataframe_5);
        const roiMetrics = this.roiMetrics.calculateROIMetrics(dataframe_3, dataframe_5);
        const engagementMetrics = this.usageMetrics.calculateEngagementMetrics(dataframe_5);
        const teamMetrics = this.collaborationMetrics.calculateTeamMetrics(dataframe_3, dataframe_5);
        const trendMetrics = this.growthMetrics.calculateTrendMetrics(dataframe_2);
        const collectionMetrics = this.contentMetrics.calculateDetailedCollectionMetrics(dataframe_2, dataframe_3);
        const contentMetrics = this.contentMetrics.calculateContentMetrics(dataframe_2, dataframe_3);

        console.log('DEBUG - Completed base metrics calculations');

        // Calculate new advanced metrics
        const evolutionMetrics = this.contentMetrics.calculateEvolutionMetrics(dataframe_2, dataframe_3);
        const collaborationPatterns = this.collaborationMetrics.calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5);
        const contentQualityMetrics = this.contentMetrics.calculateContentQualityMetrics(dataframe_2, dataframe_3);
        const usagePatterns = this.usageMetrics.calculateAdvancedUsagePatterns(dataframe_2, dataframe_3, dataframe_5);
        const predictiveMetrics = this.growthMetrics.calculatePredictiveMetrics(dataframe_2, dataframe_3);

        console.log('DEBUG - Completed advanced metrics calculations');

        const allMetrics = {
            workspace_age: workspaceAge,
            ...structureMetrics,
            ...usageMetrics,
            ...growthMetrics,
            ...organizationMetrics,
            ...roiMetrics,
            ...engagementMetrics,
            ...teamMetrics,
            ...trendMetrics,
            ...collectionMetrics,
            ...contentMetrics,
            ...evolutionMetrics,
            ...collaborationPatterns,
            ...contentQualityMetrics,
            ...usagePatterns,
            ...predictiveMetrics
        };

        // Create Notion entry with metrics
        try {
            if (!workspaceId) {
                console.error('DEBUG - Missing workspaceId in calculateAllMetrics');
                throw new Error('workspaceId is required');
            }

            const placeholderMetrics = this.metricsFormatter.logMetricsWithPlaceholders(allMetrics, dataframe_2, dataframe_3, dataframe_5);
            const pageId = await this.notionHelper.createNotionEntry(workspaceId, placeholderMetrics);
            allMetrics.notionPageId = pageId;

        } catch (error) {
            console.error('Error creating Notion entry:', error);
            allMetrics.notionError = error.message;
        }

        return allMetrics;
    }

    calculateWorkspaceAge(dataframe_2) {
        if (!dataframe_2?.length) return 0;
        
        const creationTimes = dataframe_2
            .map(row => row.CREATED_TIME)
            .filter(time => time && !isNaN(time))
            .map(time => typeof time === 'string' ? parseInt(time) : time);
            
        if (!creationTimes.length) return 0;
        
        const oldestTime = Math.min(...creationTimes);
        const now = Date.now();
        
        return Math.floor((now - oldestTime) / this.MILLISECONDS_PER_MONTH);
    }

    getFormattedMetrics(dataframe_2, dataframe_3) {
        const metrics = this.calculateAllMetrics(dataframe_2, dataframe_3);
        return this.metricsFormatter.formatMetricsForPDF(metrics);
    }
} 