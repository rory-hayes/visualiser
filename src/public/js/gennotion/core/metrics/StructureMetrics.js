export class StructureMetrics {
    constructor(calculator) {
        this.calculator = calculator;
    }

    calculateStructureMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_2?.length || !dataframe_3) {
            console.warn('No data available for structure metrics');
            return {};
        }

        // Process all nodes for accurate depth metrics
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        const pageDepths = dataframe_2.map(row => row.PAGE_DEPTH || 0);
        
        // Calculate depth statistics
        const max_depth = Math.max(...depths);
        const avg_depth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        const median_depth = this.calculateMedian(depths);
        
        // Page type analysis
        const pageTypes = this.analyzePageTypes(dataframe_2);
        
        // Collection analysis
        const collectionMetrics = this.analyzeCollections(dataframe_2, dataframe_3);
        
        // Navigation analysis
        const navigationMetrics = this.analyzeNavigation(dataframe_2, dataframe_3);

        return {
            // Depth metrics
            max_depth,
            avg_depth,
            median_depth,
            depth_distribution: this.calculateDepthDistribution(depths),
            
            // Page metrics
            total_pages: dataframe_3.TOTAL_NUM_TOTAL_PAGES,
            alive_pages: dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES,
            public_pages: dataframe_3.TOTAL_NUM_PUBLIC_PAGES,
            private_pages: dataframe_3.TOTAL_NUM_PRIVATE_PAGES,
            
            // Page types
            ...pageTypes,
            
            // Collection metrics
            ...collectionMetrics,
            
            // Navigation metrics
            ...navigationMetrics,
            
            // Health metrics
            health_score: this.calculateHealthScore(dataframe_2, dataframe_3)
        };
    }

    calculateMedian(numbers) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }

    calculateDepthDistribution(depths) {
        const distribution = {};
        depths.forEach(depth => {
            distribution[depth] = (distribution[depth] || 0) + 1;
        });
        
        return Object.entries(distribution).map(([depth, count]) => ({
            depth: parseInt(depth),
            count,
            percentage: (count / depths.length) * 100
        }));
    }

    analyzePageTypes(dataframe_2) {
        const typeCount = {};
        dataframe_2.forEach(row => {
            const type = row.TYPE || 'unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return {
            page_types: typeCount,
            page_type_distribution: Object.entries(typeCount).map(([type, count]) => ({
                type,
                count,
                percentage: (count / dataframe_2.length) * 100
            }))
        };
    }

    analyzeCollections(dataframe_2, dataframe_3) {
        return {
            total_collections: dataframe_3.NUM_COLLECTIONS,
            alive_collections: dataframe_3.NUM_ALIVE_COLLECTIONS,
            collection_views: dataframe_3.TOTAL_NUM_COLLECTION_VIEWS,
            collection_view_pages: dataframe_3.TOTAL_NUM_COLLECTION_VIEW_PAGES,
            collection_health: (dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS) * 100
        };
    }

    analyzeNavigation(dataframe_2, dataframe_3) {
        const root_pages = dataframe_2.filter(row => 
            !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID
        ).length;

        const orphaned_pages = this.countOrphanedPages(dataframe_2);

        return {
            root_pages,
            orphaned_pages,
            navigation_score: Math.max(0, 100 - (orphaned_pages / dataframe_3.TOTAL_NUM_TOTAL_PAGES * 100))
        };
    }

    calculateHealthScore(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const publicRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const collectionHealth = dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS;
        
        return (aliveRatio * 0.4 + publicRatio * 0.3 + collectionHealth * 0.3) * 100;
    }

    countOrphanedPages(dataframe_2) {
        return dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;
    }

    calculateDepthComplexity(dataframe_2) {
        const avgDepth = this.calculateAverageDepth(dataframe_2);
        const maxDepth = Math.max(...dataframe_2.map(row => row.DEPTH || 0));
        return Math.min(100, (avgDepth * 10 + maxDepth * 5));
    }

    calculateAverageDepth(dataframe_2) {
        if (!dataframe_2?.length) return 0;
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
    }

    calculateNavigationComplexity(dataframe_2) {
        const orphanedRatio = this.countOrphanedPages(dataframe_2) / dataframe_2.length;
        const deepPagesRatio = dataframe_2.filter(row => 
            (row.DEPTH || 0) > this.calculator.DEEP_PAGE_THRESHOLD
        ).length / dataframe_2.length;
        return Math.min(100, (orphanedRatio * 50 + deepPagesRatio * 50) * 100);
    }
} 