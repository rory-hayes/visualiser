import { StructureMetrics } from './StructureMetrics.js';
import { UsageMetrics } from './UsageMetrics.js';
import { GrowthMetrics } from './GrowthMetrics.js';
import { ROIMetrics } from './ROIMetrics.js';
import { BaseMetrics } from './BaseMetrics.js';
import { NotionService } from '../../services/NotionService.js';
import { Client } from '@notionhq/client';
import { EvolutionMetrics } from './EvolutionMetrics.js';
import { CollaborationPatterns } from './CollaborationPatterns.js';
import { TreeVisualizer } from '../visualization/TreeVisualizer.js';

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
        this.treeVisualizer = new TreeVisualizer();

        // Initialize Notion service
        const notionClient = new Client({ auth: notionApiKey });
        this.notionService = new NotionService(notionClient, notionDatabaseId);
    }

    async calculateAllMetrics(dataframe_2, dataframe_3, dataframe_5, workspaceId) {
        try {
            // Validate input data
            this.validateData(dataframe_2, dataframe_3, dataframe_5);

            // Generate visualization
            console.log('Generating workspace visualization...');
            let visualization = null;
            try {
                visualization = await this.treeVisualizer.generateVisualization(dataframe_2[0]);
                console.log('Visualization generated:', {
                    hasUrl: !!visualization?.imageUrl,
                    path: visualization?.visualizationPath
                });
            } catch (visualizationError) {
                console.error('Error in visualization generation:', visualizationError);
                visualization = {
                    imageUrl: null,
                    error: visualizationError.message
                };
            }

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
                visualizationUrl: visualization?.imageUrl,
                visualizationError: visualization?.error,
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
                timestamp: combinedMetrics.timestamp,
                hasVisualization: !!combinedMetrics.visualizationUrl,
                visualizationError: combinedMetrics.visualizationError
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
            tenPercent: Number((baseRevenue * 1.1).toFixed(2)),
            twentyPercent: Number((baseRevenue * 1.2).toFixed(2)),
            fiftyPercent: Number((baseRevenue * 1.5).toFixed(2))
        };
    }

    calculateBaseRevenue(dataframe_3, dataframe_5) {
        // Calculate base revenue from current members and plan costs
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        // Access PLAN_COST from the first item if it's an array, otherwise try direct access
        const planCost = Array.isArray(dataframe_5) ? 
            (dataframe_5[0]?.PLAN_COST || 0) : 
            (dataframe_5?.PLAN_COST || 0);
        // Convert to number and round to 2 decimal places
        return Number((totalMembers * planCost * 12).toFixed(2)); // Annual revenue
    }

    validateData(dataframe_2, dataframe_3, dataframe_5) {
        // Log raw input data for debugging
        console.log('Raw input data:', {
            dataframe_2: {
                value: dataframe_2,
                type: typeof dataframe_2,
                isArray: Array.isArray(dataframe_2),
                length: dataframe_2?.length
            },
            dataframe_3: {
                value: dataframe_3,
                type: typeof dataframe_3
            },
            dataframe_5: {
                value: dataframe_5,
                type: typeof dataframe_5,
                isArray: Array.isArray(dataframe_5),
                length: dataframe_5?.length
            }
        });

        // Log detailed data structure
        console.log('Validating data structures:', {
            dataframe_2: {
                type: typeof dataframe_2,
                isArray: Array.isArray(dataframe_2),
                length: dataframe_2?.length,
                sampleFields: dataframe_2?.[0] ? Object.keys(dataframe_2[0]) : [],
                sampleValues: dataframe_2?.[0] ? {
                    ID: dataframe_2[0].ID,
                    PARENT_ID: dataframe_2[0].PARENT_ID,
                    DEPTH: dataframe_2[0].DEPTH,
                    SPACE_ID: dataframe_2[0].SPACE_ID
                } : null
            },
            dataframe_3: {
                type: typeof dataframe_3,
                isObject: typeof dataframe_3 === 'object',
                keys: dataframe_3 ? Object.keys(dataframe_3) : [],
                sampleValues: {
                    NUM_PAGES: dataframe_3?.NUM_PAGES,
                    NUM_COLLECTIONS: dataframe_3?.NUM_COLLECTIONS,
                    TOTAL_NUM_MEMBERS: dataframe_3?.TOTAL_NUM_MEMBERS
                }
            },
            dataframe_5: {
                type: typeof dataframe_5,
                isArray: Array.isArray(dataframe_5),
                length: dataframe_5?.length,
                sampleValues: Array.isArray(dataframe_5) ? {
                    PLAN_COST: dataframe_5[0]?.PLAN_COST,
                    INTERACTIONS: Array.isArray(dataframe_5[0]?.INTERACTIONS) ? 
                        dataframe_5[0].INTERACTIONS.length : 'not an array'
                } : {
                    PLAN_COST: dataframe_5?.PLAN_COST,
                    INTERACTIONS: Array.isArray(dataframe_5?.INTERACTIONS) ? 
                        dataframe_5.INTERACTIONS.length : 'not an array'
                }
            }
        });

        // Initialize validation results
        let validationResults = {
            dataframe_2: false,
            dataframe_3: false,
            dataframe_5: false,
            errors: []
        };

        // Validate dataframe_2
        if (!dataframe_2) {
            validationResults.errors.push('dataframe_2 is null or undefined');
        } else if (!Array.isArray(dataframe_2)) {
            validationResults.errors.push('dataframe_2 must be an array');
        } else {
            validationResults.dataframe_2 = true;
        }

        // Validate dataframe_3
        if (!dataframe_3) {
            validationResults.errors.push('dataframe_3 is null or undefined');
        } else if (typeof dataframe_3 !== 'object') {
            validationResults.errors.push('dataframe_3 must be an object');
        } else {
            validationResults.dataframe_3 = true;
        }

        // Validate dataframe_5 - accept either array or object format
        if (!dataframe_5) {
            validationResults.errors.push('dataframe_5 is null or undefined');
        } else if (typeof dataframe_5 !== 'object') {
            validationResults.errors.push('dataframe_5 must be an object or array');
        } else {
            validationResults.dataframe_5 = true;
        }

        // Log validation results
        console.log('Validation results:', validationResults);

        // If any validation failed, throw error with details
        if (validationResults.errors.length > 0) {
            const errorMessage = `Data validation failed: ${validationResults.errors.join(', ')}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        // Validate required fields only if we have data
        const requiredFields = {
            dataframe_2: ['ID', 'PARENT_ID', 'SPACE_ID'],
            dataframe_3: ['NUM_PAGES', 'NUM_COLLECTIONS', 'TOTAL_NUM_MEMBERS'],
            dataframe_5: ['PLAN_COST']
        };

        // Check dataframe_2 fields if we have data
        if (dataframe_2?.length > 0) {
            const missingFields2 = requiredFields.dataframe_2.filter(
                field => !dataframe_2[0]?.hasOwnProperty(field)
            );
            if (missingFields2.length > 0) {
                console.error('Missing required fields in dataframe_2:', {
                    missingFields: missingFields2,
                    availableFields: Object.keys(dataframe_2[0] || {})
                });
            }
        }

        // Check dataframe_3 fields
        if (validationResults.dataframe_3) {
            const missingFields3 = requiredFields.dataframe_3.filter(
                field => !dataframe_3.hasOwnProperty(field)
            );
            if (missingFields3.length > 0) {
                console.error('Missing required fields in dataframe_3:', {
                    missingFields: missingFields3,
                    availableFields: Object.keys(dataframe_3)
                });
            }
        }

        // Check dataframe_5 fields if we have data
        if (validationResults.dataframe_5) {
            const df5ToCheck = Array.isArray(dataframe_5) ? 
                (dataframe_5[0] || {}) : 
                dataframe_5;
            
            const missingFields5 = requiredFields.dataframe_5.filter(
                field => !df5ToCheck?.hasOwnProperty(field)
            );
            if (missingFields5.length > 0) {
                console.error('Missing required fields in dataframe_5:', {
                    missingFields: missingFields5,
                    availableFields: Object.keys(df5ToCheck)
                });
            }
        }

        // Log final validation state
        console.log('Data validation complete:', {
            dataframe_2_valid: validationResults.dataframe_2,
            dataframe_3_valid: validationResults.dataframe_3,
            dataframe_5_valid: validationResults.dataframe_5,
            total_pages: dataframe_3?.NUM_PAGES,
            total_members: dataframe_3?.TOTAL_NUM_MEMBERS
        });
    }
} 