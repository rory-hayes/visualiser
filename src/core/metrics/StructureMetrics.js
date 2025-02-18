import { BaseMetrics } from './BaseMetrics.js';

export class StructureMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
    }

    calculateStructureMetrics(dataframe_2, dataframe_3) {
        this.validateData(dataframe_2, dataframe_3);

        // Basic Counts from dataframe_2
        const totalPages = dataframe_2[0]?.PAGE_COUNT || 0;
        const collectionsCount = dataframe_2[0]?.COLLECTION_COUNT || 0;
        const collectionViews = dataframe_2[0]?.COLLECTION_VIEW_COUNT || 0;
        const collectionViewPages = dataframe_2[0]?.COLLECTION_VIEW_PAGE_COUNT || 0;
        const tableRows = dataframe_2[0]?.TABLE_ROW_COUNT || 0;

        // Advanced Metrics from dataframe_3
        const totalBlocks = dataframe_3.NUM_BLOCKS || 0;
        const aliveBlocks = dataframe_3.NUM_ALIVE_BLOCKS || 0;
        const totalTotalPages = dataframe_3.TOTAL_NUM_TOTAL_PAGES || 0;
        const aliveTotalPages = dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES || 0;
        const publicPages = dataframe_3.TOTAL_NUM_PUBLIC_PAGES || 0;
        const privatePages = dataframe_3.TOTAL_NUM_PRIVATE_PAGES || 0;

        // Calculate derived metrics
        const contentHealthRatio = aliveBlocks / totalBlocks;
        const pageHealthRatio = aliveTotalPages / totalTotalPages;
        const structuredContentRatio = (collectionsCount + collectionViewPages) / totalPages;
        const publicContentRatio = publicPages / totalTotalPages;
        const averageRowsPerCollection = collectionsCount > 0 ? tableRows / collectionsCount : 0;
        
        // Calculate structure quality scores
        const structureHealthScore = this.calculateStructureHealthScore({
            contentHealthRatio,
            pageHealthRatio,
            structuredContentRatio
        });

        const contentOrganizationScore = this.calculateContentOrganizationScore({
            collectionsCount,
            collectionViews,
            totalPages
        });

        const knowledgeStructureScore = this.calculateKnowledgeStructureScore({
            publicContentRatio,
            structuredContentRatio,
            averageRowsPerCollection
        });

        return {
            // Basic Metrics
            total_pages: totalPages,
            collections_count: collectionsCount,
            collection_views: collectionViews,
            collection_view_pages: collectionViewPages,
            total_table_rows: tableRows,
            
            // Block and Page Health
            total_blocks: totalBlocks,
            alive_blocks: aliveBlocks,
            total_pages_all: totalTotalPages,
            alive_pages_all: aliveTotalPages,
            public_pages: publicPages,
            private_pages: privatePages,
            
            // Derived Ratios (as raw numbers)
            content_health_ratio: contentHealthRatio,
            page_health_ratio: pageHealthRatio,
            structured_content_ratio: structuredContentRatio,
            public_content_ratio: publicContentRatio,
            
            // Derived Metrics
            average_rows_per_collection: averageRowsPerCollection,
            
            // Quality Scores (as raw numbers)
            structure_health_score: structureHealthScore,
            content_organization_score: contentOrganizationScore,
            knowledge_structure_score: knowledgeStructureScore,
            
            // Additional Derived Metrics
            collection_density: collectionsCount / totalPages,
            view_per_collection_ratio: collectionViews / collectionsCount,
            database_complexity_score: this.calculateDatabaseComplexity({
                tableRows,
                collectionsCount,
                totalPages
            })
        };
    }

    calculateStructureHealthScore({ contentHealthRatio, pageHealthRatio, structuredContentRatio }) {
        const weights = {
            contentHealth: 0.4,
            pageHealth: 0.4,
            structuredContent: 0.2
        };

        return (
            contentHealthRatio * weights.contentHealth +
            pageHealthRatio * weights.pageHealth +
            structuredContentRatio * weights.structuredContent
        );
    }

    calculateContentOrganizationScore({ collectionsCount, collectionViews, totalPages }) {
        if (totalPages === 0) return 0;

        const collectionDensity = collectionsCount / totalPages;
        const viewDiversity = collectionViews / (collectionsCount || 1);

        return Math.min(
            ((collectionDensity * 0.5) + (viewDiversity * 0.5)),
            1
        );
    }

    calculateKnowledgeStructureScore({ publicContentRatio, structuredContentRatio, averageRowsPerCollection }) {
        const normalizedRowsScore = Math.min(averageRowsPerCollection / 1000, 1);
        
        return (
            publicContentRatio * 0.3 +
            structuredContentRatio * 0.4 +
            normalizedRowsScore * 0.3
        );
    }

    calculateDatabaseComplexity({ tableRows, collectionsCount, totalPages }) {
        if (totalPages === 0 || collectionsCount === 0) return 0;

        const avgRowsPerCollection = tableRows / collectionsCount;
        const normalizedRowsScore = Math.min(avgRowsPerCollection / 1000, 1);
        const collectionDensity = collectionsCount / totalPages;

        return (normalizedRowsScore * 0.6 + collectionDensity * 0.4);
    }

    calculateDepths(dataframe_2) {
        const depths = new Map();
        
        const calculateDepth = (pageId, visited = new Set()) => {
            // Prevent infinite loops from circular references
            if (visited.has(pageId)) {
                console.warn('Circular reference detected in page hierarchy:', {
                    pageId,
                    visited: Array.from(visited)
                });
                return 0;
            }
            
            if (depths.has(pageId)) return depths.get(pageId);
            
            const page = dataframe_2.find(p => p.ID === pageId);
            if (!page) {
                console.warn('Page not found:', pageId);
                return 0;
            }

            visited.add(pageId);
            
            if (!page.PARENT_ID) {
                depths.set(pageId, 0);
                return 0;
            }

            const parentDepth = calculateDepth(page.PARENT_ID, visited);
            const depth = parentDepth + 1;
            depths.set(pageId, depth);
            
            return depth;
        };

        // Calculate depths for all pages
        dataframe_2.forEach(page => {
            if (!depths.has(page.ID)) {
                calculateDepth(page.ID);
            }
        });

        return Array.from(depths.values());
    }

    getDepthDistribution(depths) {
        return depths.reduce((acc, depth) => {
            acc[depth] = (acc[depth] || 0) + 1;
            return acc;
        }, {});
    }

    calculateNavigationComplexity(data) {
        // Calculate complexity based on the ratio of collection views to total pages
        const complexityRatio = (data.COLLECTION_VIEW_COUNT + data.COLLECTION_COUNT) / 
                              (data.PAGE_COUNT || 1);
        return Math.min(complexityRatio, 1);
    }

    calculateContentDiversity(data) {
        const totalItems = data.PAGE_COUNT || 1;
        const types = {
            pages: data.PAGE_COUNT - data.COLLECTION_VIEW_PAGE_COUNT,
            collections: data.COLLECTION_COUNT,
            collectionViews: data.COLLECTION_VIEW_COUNT,
            collectionViewPages: data.COLLECTION_VIEW_PAGE_COUNT
        };

        // Calculate Shannon diversity index
        let diversity = 0;
        Object.values(types).forEach(count => {
            if (count > 0) {
                const p = count / totalItems;
                diversity -= p * Math.log2(p);
            }
        });

        // Normalize to 0-1 range
        const maxDiversity = Math.log2(Object.keys(types).length);
        return diversity / maxDiversity;
    }

    validateData(dataframe_2, dataframe_3) {
        if (!dataframe_2 || typeof dataframe_2 !== 'object') {
            throw new Error('dataframe_2 must be a valid object');
        }
        if (!dataframe_3 || typeof dataframe_3 !== 'object') {
            throw new Error('dataframe_3 must be a valid object');
        }
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

    calculateUnlinkedPercentage(pages) {
        const totalPages = pages.length;
        const unlinkedPages = pages.filter(page => 
            !page.PARENT_ID && 
            !page.ANCESTORS?.length && 
            page.TYPE !== 'root'
        ).length;
        return (unlinkedPages / totalPages) * 100;
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
