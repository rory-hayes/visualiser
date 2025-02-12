import { BaseMetrics } from './BaseMetrics.js';

export class EvolutionMetrics extends BaseMetrics {
    calculateEvolutionMetrics(dataframe_2, dataframe_3, dataframe_5) {
        this.validateData(dataframe_2, dataframe_3, dataframe_5);

        const contentMaturityScore = this.calculateContentMaturityScore(dataframe_2);
        const growthSustainabilityIndex = this.calculateGrowthSustainabilityIndex(dataframe_3);
        const workspaceComplexityScore = this.calculateWorkspaceComplexityScore(dataframe_2, dataframe_3);
        const knowledgeStructureScore = this.calculateKnowledgeStructureScore(dataframe_2);

        return {
            content_maturity_score: contentMaturityScore,
            growth_sustainability_index: growthSustainabilityIndex,
            workspace_complexity_score: workspaceComplexityScore,
            knowledge_structure_score: knowledgeStructureScore
        };
    }

    calculateContentMaturityScore(data) {
        const totalPages = data.PAGE_COUNT || 0;
        if (totalPages === 0) return 0;

        const structuredPages = (data.COLLECTION_VIEW_PAGE_COUNT || 0) + 
                              (data.COLLECTION_COUNT || 0);
        
        const structureScore = structuredPages / totalPages;
        const collectionScore = data.COLLECTION_COUNT / totalPages;
        const viewScore = data.COLLECTION_VIEW_COUNT / totalPages;
        
        return ((structureScore + collectionScore + viewScore) / 3) * 100;
    }

    calculateGrowthSustainabilityIndex(workspace) {
        const contentRatio = workspace.NUM_ALIVE_BLOCKS / workspace.NUM_BLOCKS;
        const collectionRatio = workspace.NUM_ALIVE_COLLECTIONS / workspace.NUM_COLLECTIONS;
        const pageRatio = workspace.NUM_ALIVE_PAGES / workspace.NUM_PAGES;
        
        return ((contentRatio + collectionRatio + pageRatio) / 3) * 100;
    }

    calculateWorkspaceComplexityScore(data, workspace) {
        const pageComplexity = data.PAGE_COUNT / 1000; // Normalize to 1000 pages
        const collectionComplexity = data.COLLECTION_COUNT / 100; // Normalize to 100 collections
        const viewComplexity = data.COLLECTION_VIEW_COUNT / 200; // Normalize to 200 views
        
        return Math.min(
            ((pageComplexity + collectionComplexity + viewComplexity) / 3) * 100,
            100
        );
    }

    calculateKnowledgeStructureScore(data) {
        const totalPages = data.PAGE_COUNT || 0;
        if (totalPages === 0) return 0;

        const structuredContentRatio = (data.COLLECTION_VIEW_PAGE_COUNT + data.COLLECTION_COUNT) / totalPages;
        const collectionViewRatio = data.COLLECTION_VIEW_COUNT / totalPages;
        
        return ((structuredContentRatio + collectionViewRatio) / 2) * 100;
    }
} 