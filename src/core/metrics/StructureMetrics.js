import { BaseMetrics } from './BaseMetrics.js';

export class StructureMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
    }

    calculateStructureMetrics(dataframe_2, dataframe_3) {
        this.validateData(dataframe_2, dataframe_3);

        // Log data structure for debugging
        console.log('Structure Metrics Data:', {
            first_page: dataframe_2[0],
            has_depth: dataframe_2.some(p => p.DEPTH !== undefined),
            has_parent_id: dataframe_2.some(p => p.PARENT_ID !== undefined),
            total_pages: dataframe_2.length,
            sample_fields: Object.keys(dataframe_2[0] || {}),
            parent_ids_sample: dataframe_2.slice(0, 5).map(p => p.PARENT_ID),
            depth_values_sample: dataframe_2.slice(0, 5).map(p => p.DEPTH)
        });

        // Calculate depths using parent-child relationships
        const calculatedDepths = this.calculateDepths(dataframe_2);
        console.log('Calculated Depths:', {
            max_depth: Math.max(...calculatedDepths, 0),
            avg_depth: this.average(calculatedDepths),
            depth_distribution: this.getDepthDistribution(calculatedDepths),
            sample_depths: calculatedDepths.slice(0, 5)
        });

        // Calculate basic counts
        const totalPages = dataframe_3.NUM_PAGES || dataframe_2.length;
        const maxDepth = Math.max(...calculatedDepths, 0);
        const avgDepth = this.average(calculatedDepths);
        const deepPagesCount = calculatedDepths.filter(d => d > 3).length;
        const rootPages = dataframe_2.filter(page => !page.PARENT_ID).length;
        const orphanedBlocks = this.countOrphanedBlocks(dataframe_2);
        const collectionsCount = dataframe_3.NUM_COLLECTIONS || 0;
        const collectionViews = dataframe_3.NUM_COLLECTION_VIEWS || 0;
        
        // Calculate advanced metrics
        const navDepthScore = this.calculateNavigationDepthScore(calculatedDepths);
        const scatterIndex = this.calculateScatterIndex(dataframe_2);
        const bottleneckCount = this.identifyBottlenecks(dataframe_2).length;
        const duplicateCount = this.findDuplicates(dataframe_2).length;
        const unfindablePages = this.countUnfindablePages(dataframe_2);
        const percentageUnlinked = this.calculateUnlinkedPercentage(dataframe_2);

        // Log calculated metrics
        console.log('Structure Metrics Results:', {
            maxDepth,
            avgDepth,
            deepPagesCount,
            rootPages,
            orphanedBlocks,
            navDepthScore,
            scatterIndex,
            bottleneckCount,
            unfindablePages,
            percentageUnlinked
        });

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
            nav_complexity: this.calculateNavigationComplexity(dataframe_2)
        };
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
