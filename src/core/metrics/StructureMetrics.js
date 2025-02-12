import { BaseMetrics } from './BaseMetrics.js';

export class StructureMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
    }

    calculateStructureMetrics(dataframe_2, dataframe_3) {
        this.validateData(dataframe_2, dataframe_3);

        const depths = this.calculateDepths(dataframe_2);
        const typeDistribution = this.getTypeDistribution(dataframe_2);
        const depthStats = this.calculateDepthStatistics(dataframe_2);
        
        return {
            totalPages: dataframe_2.length,
            maxDepth: depthStats.maxDepth,
            avgDepth: depthStats.avgDepth,
            deepPagesCount: depthStats.deepPagesCount,
            orphanedBlocks: this.countOrphanedBlocks(dataframe_2),
            collectionsCount: typeDistribution.collection || 0,
            contentDiversityScore: this.calculateContentDiversityScore(typeDistribution),
            structureQualityIndex: this.calculateStructureQualityIndex({
                avgDepth: depthStats.avgDepth,
                deepPages: depthStats.deepPagesCount,
                orphanedPages: this.countOrphanedPages(dataframe_2),
                totalPages: dataframe_2.length
            })
        };
    }

    calculateDepths(dataframe_2) {
        const depths = new Map();
        const calculateDepth = (pageId, depth = 0) => {
            if (depths.has(pageId)) return depths.get(pageId);
            
            const page = dataframe_2.find(p => p.ID === pageId);
            if (!page) return depth;

            const parentDepth = page.PARENT_ID ? 
                calculateDepth(page.PARENT_ID, depth + 1) : 
                depth;
            
            depths.set(pageId, parentDepth);
            return parentDepth;
        };

        dataframe_2.forEach(page => calculateDepth(page.ID));
        return Array.from(depths.values());
    }

    calculateDepthStatistics(dataframe_2) {
        const depths = this.calculateDepths(dataframe_2);
        const maxDepth = Math.max(...depths, 0);
        const avgDepth = this.average(depths);
        const deepPagesCount = depths.filter(d => d > 3).length;

        return { maxDepth, avgDepth, deepPagesCount };
    }

    countOrphanedBlocks(dataframe_2) {
        return dataframe_2.filter(page => 
            !page.PARENT_ID && 
            page.TYPE !== 'root' && 
            page.TYPE !== 'workspace'
        ).length;
    }

    countOrphanedPages(dataframe_2) {
        return dataframe_2.filter(page => 
            !page.PARENT_ID && 
            !page.COLLECTION_ID && 
            page.TYPE === 'page'
        ).length;
    }

    getTypeDistribution(dataframe_2) {
        return dataframe_2.reduce((acc, page) => {
            const type = page.TYPE.toLowerCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
    }

    calculateContentDiversityScore(typeDistribution) {
        const total = Object.values(typeDistribution).reduce((a, b) => a + b, 0);
        if (total === 0) return 0;

        const proportions = Object.values(typeDistribution).map(count => count / total);
        const entropy = -proportions.reduce((acc, p) => 
            acc + (p === 0 ? 0 : p * Math.log2(p)), 0);
        
        // Normalize to 0-1 range
        const maxEntropy = Math.log2(Object.keys(typeDistribution).length);
        return entropy / maxEntropy;
    }

    calculateStructureQualityIndex({ avgDepth, deepPages, orphanedPages, totalPages }) {
        if (totalPages === 0) return 0;

        const depthScore = Math.max(0, 1 - (avgDepth > 5 ? (avgDepth - 5) / 5 : 0));
        const deepPagesScore = 1 - (deepPages / totalPages);
        const orphanedScore = 1 - (orphanedPages / totalPages);

        return (depthScore + deepPagesScore + orphanedScore) / 3;
    }
}
