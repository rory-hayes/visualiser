export class ContentMetrics {
    constructor(calculator) {
        this.calculator = calculator;
    }

    calculateDetailedCollectionMetrics(dataframe_2, dataframe_3) {
        const collections = dataframe_2.filter(row => row.TYPE === 'collection');
        const linkedCollections = collections.filter(row => row.PARENT_ID);
        const avgItemsPerCollection = dataframe_3.NUM_BLOCKS / (dataframe_3.NUM_COLLECTIONS || 1);

        return {
            total_collections: dataframe_3.NUM_COLLECTIONS,
            linked_database_count: linkedCollections.length,
            standalone_database_count: collections.length - linkedCollections.length,
            avg_items_per_collection: avgItemsPerCollection,
            collection_usage_ratio: (dataframe_3.TOTAL_NUM_COLLECTION_VIEWS / dataframe_3.NUM_COLLECTIONS) || 0,
            collection_health_score: this.calculateCollectionHealthScore(dataframe_3),
            template_count: dataframe_2.filter(row => row.TYPE === 'template').length
        };
    }

    calculateContentMetrics(dataframe_2, dataframe_3) {
        const typeDistribution = {};
        dataframe_2.forEach(row => {
            const type = row.TYPE || 'unknown';
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        });

        const titleCounts = {};
        dataframe_2.forEach(row => {
            const title = row.TEXT || '';
            if (title.trim()) {
                titleCounts[title] = (titleCounts[title] || 0) + 1;
            }
        });

        const duplicateCount = Object.values(titleCounts).filter(count => count > 1).length;

        return {
            content_type_distribution: typeDistribution,
            duplicate_content_rate: (duplicateCount / dataframe_2.length) * 100,
            content_health_score: this.calculateContentHealthScore(dataframe_2, dataframe_3),
            avg_content_per_type: Object.values(typeDistribution).reduce((a, b) => a + b, 0) / Object.keys(typeDistribution).length,
            content_diversity_score: this.calculateContentDiversityScore(typeDistribution)
        };
    }

    calculateEvolutionMetrics(dataframe_2, dataframe_3) {
        const workspaceAge = this.calculator.calculateWorkspaceAge(dataframe_2);
        const depthStats = this.calculateDepthStatistics(dataframe_2);
        const contentDiversity = this.calculateContentDiversityScore(this.getTypeDistribution(dataframe_2));

        return {
            content_maturity_score: this.calculateContentMaturityScore(workspaceAge, depthStats, contentDiversity),
            growth_sustainability_index: this.calculateGrowthSustainability(dataframe_2, dataframe_3),
            workspace_complexity_score: this.calculateWorkspaceComplexity(dataframe_2, dataframe_3),
            knowledge_structure_score: this.calculateKnowledgeStructure(dataframe_2, dataframe_3)
        };
    }

    calculateContentQualityMetrics(dataframe_2, dataframe_3) {
        const creationPatterns = this.analyzeCreationPatterns(dataframe_2);
        const structureQuality = this.analyzeStructureQuality(dataframe_2);
        const contentHealth = this.analyzeContentHealth(dataframe_2, dataframe_3);

        return {
            content_freshness_score: this.calculateContentFreshness(creationPatterns),
            structure_quality_index: this.calculateStructureQualityIndex(structureQuality),
            knowledge_base_health: this.calculateKnowledgeBaseHealth(contentHealth),
            content_organization_score: this.calculateContentOrganization(dataframe_2, dataframe_3),
            documentation_coverage: this.calculateDocumentationCoverage(dataframe_2, dataframe_3)
        };
    }

    calculateCollectionHealthScore(dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS;
        const viewsRatio = dataframe_3.TOTAL_NUM_COLLECTION_VIEWS / (dataframe_3.NUM_COLLECTIONS * 2); // Assuming 2 views per collection is good
        return (aliveRatio * 0.6 + Math.min(1, viewsRatio) * 0.4) * 100;
    }

    calculateContentHealthScore(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS;
        const depthScore = 1 - (this.calculator.structureMetrics.calculateAverageDepth(dataframe_2) / 10); // Penalize deep nesting
        const orphanedRatio = 1 - (this.calculator.structureMetrics.countOrphanedPages(dataframe_2) / dataframe_2.length);
        
        return (aliveRatio * 0.4 + depthScore * 0.3 + orphanedRatio * 0.3) * 100;
    }

    calculateContentDiversityScore(typeDistribution) {
        const total = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
        const typeRatios = Object.values(typeDistribution).map(count => count / total);
        
        // Calculate Shannon Diversity Index
        return -typeRatios.reduce((sum, ratio) => sum + (ratio * Math.log(ratio)), 0) * 100;
    }

    calculateDepthStatistics(dataframe_2) {
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        const avgDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        const maxDepth = Math.max(...depths);
        const medianDepth = this.calculateMedian(depths);
        const depthDistribution = this.calculateDepthDistribution(depths);

        return {
            avgDepth,
            maxDepth,
            medianDepth,
            depthDistribution,
            deepPagesCount: depths.filter(d => d > this.calculator.DEEP_PAGE_THRESHOLD).length
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

    getTypeDistribution(dataframe_2) {
        const typeCount = {};
        dataframe_2.forEach(row => {
            const type = row.TYPE || 'unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return typeCount;
    }

    calculateContentMaturityScore(workspaceAge, depthStats, contentDiversity) {
        const ageScore = Math.min(workspaceAge / 12, 1) * 100; // Cap at 12 months
        const depthScore = 100 - (depthStats.avgDepth * 10); // Penalize excessive depth
        const diversityScore = contentDiversity;

        return (ageScore * 0.3 + depthScore * 0.3 + diversityScore * 0.4);
    }

    calculateGrowthSustainability(dataframe_2, dataframe_3) {
        const contentGrowth = this.calculateContentGrowthRate(dataframe_2);
        const qualityScore = this.calculateQualityScore(dataframe_2, dataframe_3);
        const organizationScore = this.calculateOrganizationScore(dataframe_2);

        return (contentGrowth * 0.3 + qualityScore * 0.4 + organizationScore * 0.3);
    }

    calculateContentGrowthRate(dataframe_2) {
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * this.calculator.MILLISECONDS_PER_DAY);
        const ninetyDaysAgo = now - (90 * this.calculator.MILLISECONDS_PER_DAY);

        const last30DaysContent = dataframe_2.filter(row => 
            parseInt(row.CREATED_TIME) > thirtyDaysAgo
        ).length;

        const last90DaysContent = dataframe_2.filter(row => 
            parseInt(row.CREATED_TIME) > ninetyDaysAgo
        ).length;

        const monthlyRate = last30DaysContent;
        const quarterlyRate = last90DaysContent / 3;

        if (quarterlyRate === 0) return 0;
        return ((monthlyRate - quarterlyRate) / quarterlyRate) * 100;
    }

    calculateQualityScore(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS;
        const structureScore = this.calculateStructureScore(
            this.calculator.structureMetrics.calculateAverageDepth(dataframe_2),
            dataframe_2.filter(row => (row.DEPTH || 0) > this.calculator.DEEP_PAGE_THRESHOLD).length,
            this.calculator.structureMetrics.countOrphanedPages(dataframe_2),
            dataframe_2.length
        );
        
        return (aliveRatio * 50 + structureScore / 100 * 50);
    }

    calculateOrganizationScore(dataframe_2) {
        const templateRatio = dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length;
        const collectionRatio = dataframe_2.filter(row => row.TYPE === 'collection_view_page').length / dataframe_2.length;
        const avgDepth = this.calculator.structureMetrics.calculateAverageDepth(dataframe_2);
        const depthScore = Math.max(0, 100 - (avgDepth * 10));

        return (templateRatio * 30 + collectionRatio * 40 + depthScore * 0.3);
    }

    calculateWorkspaceComplexity(dataframe_2, dataframe_3) {
        const depthComplexity = this.calculator.structureMetrics.calculateDepthComplexity(dataframe_2);
        const navigationComplexity = this.calculator.structureMetrics.calculateNavigationComplexity(dataframe_2);
        const contentComplexity = this.calculateContentComplexity(dataframe_2, dataframe_3);

        return {
            overall_complexity: (depthComplexity + navigationComplexity + contentComplexity) / 3,
            depth_complexity: depthComplexity,
            navigation_complexity: navigationComplexity,
            content_complexity: contentComplexity
        };
    }

    calculateContentComplexity(dataframe_2, dataframe_3) {
        const typeDistribution = this.getTypeDistribution(dataframe_2);
        const typeCount = Object.keys(typeDistribution).length;
        const collectionRatio = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return Math.min(100, (typeCount * 10 + collectionRatio * 50));
    }

    calculateKnowledgeStructure(dataframe_2, dataframe_3) {
        const templateScore = (dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length) * 100;
        const collectionScore = (dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100;
        const hierarchyScore = Math.max(0, 100 - (this.calculator.structureMetrics.calculateAverageDepth(dataframe_2) * 10));
        const organizationScore = this.calculateOrganizationScore(dataframe_2);

        return (templateScore * 0.25 + collectionScore * 0.25 + hierarchyScore * 0.25 + organizationScore * 0.25);
    }

    analyzeCreationPatterns(dataframe_2) {
        const now = Date.now();
        const creationTimes = dataframe_2.map(row => parseInt(row.CREATED_TIME));
        const timeRanges = {
            last_24h: 0,
            last_week: 0,
            last_month: 0,
            last_quarter: 0
        };

        creationTimes.forEach(time => {
            const age = now - time;
            if (age <= this.calculator.MILLISECONDS_PER_DAY) timeRanges.last_24h++;
            if (age <= 7 * this.calculator.MILLISECONDS_PER_DAY) timeRanges.last_week++;
            if (age <= 30 * this.calculator.MILLISECONDS_PER_DAY) timeRanges.last_month++;
            if (age <= 90 * this.calculator.MILLISECONDS_PER_DAY) timeRanges.last_quarter++;
        });

        return {
            creation_ranges: timeRanges,
            daily_average: timeRanges.last_month / 30,
            weekly_average: timeRanges.last_week / 7,
            creation_trend: this.calculateCreationTrend(timeRanges)
        };
    }

    calculateCreationTrend(timeRanges) {
        const monthlyRate = timeRanges.last_month / 30;
        const quarterlyRate = timeRanges.last_quarter / 90;
        return ((monthlyRate - quarterlyRate) / quarterlyRate) * 100;
    }

    analyzeStructureQuality(dataframe_2) {
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        const orphanedPages = this.calculator.structureMetrics.countOrphanedPages(dataframe_2);
        const avgDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        const deepPages = depths.filter(d => d > this.calculator.DEEP_PAGE_THRESHOLD).length;

        return {
            avg_depth: avgDepth,
            deep_pages_ratio: deepPages / dataframe_2.length,
            orphaned_ratio: orphanedPages / dataframe_2.length,
            structure_score: this.calculateStructureScore(avgDepth, deepPages, orphanedPages, dataframe_2.length)
        };
    }

    calculateStructureScore(avgDepth, deepPages, orphanedPages, totalPages) {
        const depthScore = Math.max(0, 100 - (avgDepth * 10));
        const deepPagesScore = Math.max(0, 100 - (deepPages / totalPages * 200));
        const orphanedScore = Math.max(0, 100 - (orphanedPages / totalPages * 200));

        return (depthScore * 0.4 + deepPagesScore * 0.3 + orphanedScore * 0.3);
    }

    analyzeContentHealth(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS;
        const recentContent = dataframe_2.filter(row => {
            const age = Date.now() - parseInt(row.CREATED_TIME);
            return age < 90 * this.calculator.MILLISECONDS_PER_DAY;
        }).length;
        
        return {
            alive_ratio: aliveRatio,
            recent_content_ratio: recentContent / dataframe_2.length,
            health_score: (aliveRatio * 60 + (recentContent / dataframe_2.length) * 40)
        };
    }

    calculateContentFreshness(creationPatterns) {
        const recentContentScore = (creationPatterns.creation_ranges.last_month / 30) * 100;
        const trendScore = Math.max(0, 100 + creationPatterns.creation_trend);
        return (recentContentScore * 0.6 + trendScore * 0.4);
    }

    calculateStructureQualityIndex(structureQuality) {
        return Math.max(0, 100 - (
            structureQuality.avg_depth * 10 +
            structureQuality.deep_pages_ratio * 30 +
            structureQuality.orphaned_ratio * 20
        ));
    }

    calculateKnowledgeBaseHealth(contentHealth) {
        return contentHealth.health_score;
    }

    calculateContentOrganization(dataframe_2, dataframe_3) {
        const collectionRatio = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const templateRatio = dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length;
        const structuredContent = (collectionRatio * 50) + (templateRatio * 50);
        return Math.min(100, structuredContent);
    }

    calculateDocumentationCoverage(dataframe_2, dataframe_3) {
        const totalProcesses = dataframe_3.NUM_COLLECTIONS;
        const documentedProcesses = dataframe_2.filter(row => 
            row.TYPE === 'template' || row.TYPE === 'collection_view_page'
        ).length;
        
        return Math.min(100, (documentedProcesses / (totalProcesses || 1)) * 100);
    }
} 