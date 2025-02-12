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

    calculateContentMaturityScore(pages) {
        const totalPages = pages.length;
        const structuredPages = pages.filter(p => 
            p.TYPE === 'collection_view' || 
            p.TYPE === 'collection_view_page'
        ).length;
        
        const avgDepth = this.average(pages.map(p => parseInt(p.DEPTH) || 0));
        const hasAncestors = pages.filter(p => p.ANCESTORS && p.ANCESTORS.length > 0).length;
        
        const structureScore = structuredPages / totalPages;
        const hierarchyScore = hasAncestors / totalPages;
        const depthScore = Math.min(avgDepth / 5, 1); // Normalize to max depth of 5
        
        return ((structureScore + hierarchyScore + depthScore) / 3) * 100;
    }

    calculateGrowthSustainabilityIndex(workspace) {
        const contentRatio = workspace.NUM_ALIVE_BLOCKS / workspace.NUM_BLOCKS;
        const collectionRatio = workspace.NUM_ALIVE_COLLECTIONS / workspace.NUM_COLLECTIONS;
        const pageRatio = workspace.NUM_ALIVE_PAGES / workspace.NUM_PAGES;
        
        return ((contentRatio + collectionRatio + pageRatio) / 3) * 100;
    }

    calculateWorkspaceComplexityScore(pages, workspace) {
        const pageComplexity = pages.length / 1000; // Normalize to 1000 pages
        const blockComplexity = workspace.NUM_BLOCKS / 10000; // Normalize to 10000 blocks
        const collectionComplexity = workspace.NUM_COLLECTIONS / 100; // Normalize to 100 collections
        
        return Math.min(
            ((pageComplexity + blockComplexity + collectionComplexity) / 3) * 100,
            100
        );
    }

    calculateKnowledgeStructureScore(pages) {
        const totalPages = pages.length;
        const maxDepth = Math.max(...pages.map(p => parseInt(p.DEPTH) || 0));
        const avgAncestors = this.average(
            pages.map(p => p.ANCESTORS ? JSON.parse(p.ANCESTORS).length : 0)
        );
        
        const depthScore = Math.min(maxDepth / 10, 1); // Normalize to max depth of 10
        const ancestorScore = Math.min(avgAncestors / 5, 1); // Normalize to avg of 5 ancestors
        const structureScore = pages.filter(p => p.TYPE !== 'page').length / totalPages;
        
        return ((depthScore + ancestorScore + structureScore) / 3) * 100;
    }
} 