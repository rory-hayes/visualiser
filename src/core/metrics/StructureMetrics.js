import { BaseMetrics } from './BaseMetrics.js';

export class StructureMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
    }

    calculateStructureMetrics(dataframe_2, dataframe_3) {
        this.validateData(dataframe_2, dataframe_3);

        // Calculate basic counts
        const totalPages = dataframe_3.NUM_PAGES || 0;
        const maxDepth = Math.max(...dataframe_2.map(page => parseInt(page.DEPTH) || 0));
        const depths = dataframe_2.map(page => parseInt(page.DEPTH) || 0);
        const avgDepth = this.average(depths);
        const deepPagesCount = depths.filter(d => d > 3).length;
        const rootPages = dataframe_2.filter(page => !page.PARENT_ID).length;
        const orphanedBlocks = this.countOrphanedBlocks(dataframe_2);
        const collectionsCount = dataframe_3.NUM_COLLECTIONS || 0;
        const collectionViews = dataframe_3.NUM_COLLECTION_VIEWS || 0;
        
        // Calculate advanced metrics
        const navDepthScore = this.calculateNavigationDepthScore(depths);
        const scatterIndex = this.calculateScatterIndex(dataframe_2);
        const bottleneckCount = this.identifyBottlenecks(dataframe_2).length;
        const duplicateCount = this.findDuplicates(dataframe_2).length;
        const unfindablePages = this.countUnfindablePages(dataframe_2);
        const navComplexity = this.calculateNavigationComplexity(dataframe_2);
        const percentageUnlinked = this.calculateUnlinkedPercentage(dataframe_2);

        return {
            total_pages: totalPages,
            max_depth: maxDepth,
            avg_depth: avgDepth,
            deep_pages_count: deepPagesCount,
            root_pages: rootPages,
            orphaned_blocks: orphanedBlocks,
            percentage_unlinked: percentageUnlinked,
            collections_count: collectionsCount,
            page_count: totalPages,
            collection_views: collectionViews,
            nav_depth_score: navDepthScore,
            scatter_index: scatterIndex,
            bottleneck_count: bottleneckCount,
            duplicate_count: duplicateCount,
            unfindable_pages: unfindablePages,
            nav_complexity: navComplexity
        };
    }

    calculateNavigationDepthScore(depths) {
        const optimalDepth = 3;
        const depthDeviations = depths.map(d => Math.abs(d - optimalDepth));
        return 1 - (this.average(depthDeviations) / optimalDepth);
    }

    calculateScatterIndex(pages) {
        const totalPages = pages.length;
        const unconnectedPages = pages.filter(page => !page.PARENT_ID && !page.ANCESTORS?.length).length;
        return unconnectedPages / totalPages;
    }

    identifyBottlenecks(pages) {
        return pages.filter(page => {
            const childCount = pages.filter(p => p.PARENT_ID === page.ID).length;
            return childCount > 10; // Pages with more than 10 direct children
        });
    }

    findDuplicates(pages) {
        const titles = pages.map(p => p.TEXT).filter(Boolean);
        return titles.filter((title, index) => titles.indexOf(title) !== index);
    }

    countUnfindablePages(pages) {
        return pages.filter(page => 
            !page.PARENT_ID && 
            !page.ANCESTORS?.length && 
            page.TYPE !== 'root'
        ).length;
    }

    calculateNavigationComplexity(pages) {
        const maxDepth = Math.max(...pages.map(p => parseInt(p.DEPTH) || 0));
        const branchingFactor = this.average(
            pages.map(page => 
                pages.filter(p => p.PARENT_ID === page.ID).length
            )
        );
        return (maxDepth * branchingFactor) / 100;
    }

    calculateUnlinkedPercentage(pages) {
        const totalPages = pages.length;
        const unlinkedPages = pages.filter(page => 
            !page.PARENT_ID && 
            !page.ANCESTORS?.length && 
            page.TYPE !== 'root'
        ).length;
        return (unlinkedPages / totalPages) * 100;
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
