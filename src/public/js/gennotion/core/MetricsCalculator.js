export class MetricsCalculator {
    constructor() {
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

        // Notion API configuration
        this.NOTION_DATABASE_ID = "18730aa1-c7a9-8059-b53e-de31cde8bfc4";
        this.NOTION_API_KEY = "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";
    }

    async calculateAllMetrics(dataframe_2, dataframe_3, dataframe_5) {
        // Log all the data
        console.log('Data received:', {
            dataframe_2_length: dataframe_2?.length,
            dataframe_3: dataframe_3,
            dataframe_5_length: dataframe_5?.length
        });

        // Calculate workspace age and validate data
        const workspaceAge = this.calculateWorkspaceAge(dataframe_2);
        console.log('Workspace age (months):', workspaceAge);

        const structureMetrics = this.calculateStructureMetrics(dataframe_2, dataframe_3);
        const usageMetrics = this.calculateUsageMetrics(dataframe_3, dataframe_5);
        const growthMetrics = this.calculateGrowthMetrics(dataframe_3, dataframe_2, dataframe_5);
        const organizationMetrics = this.calculateOrganizationMetrics(dataframe_3, dataframe_5);
        const roiMetrics = this.calculateROIMetrics(dataframe_3, dataframe_5);
        const engagementMetrics = this.calculateEngagementMetrics(dataframe_5);
        const teamMetrics = this.calculateTeamMetrics(dataframe_3, dataframe_5);
        const trendMetrics = this.calculateTrendMetrics(dataframe_2);
        const collectionMetrics = this.calculateDetailedCollectionMetrics(dataframe_2, dataframe_3);
        const contentMetrics = this.calculateContentMetrics(dataframe_2, dataframe_3);

        // Calculate new advanced metrics
        const evolutionMetrics = this.calculateEvolutionMetrics(dataframe_2, dataframe_3);
        const collaborationPatterns = this.calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5);
        const contentQualityMetrics = this.calculateContentQualityMetrics(dataframe_2, dataframe_3);
        const usagePatterns = this.calculateAdvancedUsagePatterns(dataframe_2, dataframe_3, dataframe_5);
        const predictiveMetrics = this.calculatePredictiveMetrics(dataframe_2, dataframe_3);

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

        // Log metrics with placeholders
        const placeholderMetrics = this.logMetricsWithPlaceholders(allMetrics, dataframe_2, dataframe_3, dataframe_5);

        // Create Notion entry with all metrics
        try {
            await this.createNotionEntry(workspaceId, placeholderMetrics);
        } catch (error) {
            console.error('Error creating Notion entry:', error);
        }

        return allMetrics;
    }

    calculateWorkspaceAge(dataframe_2) {
        if (!dataframe_2?.length) return 0;
        
        const creationTimes = dataframe_2.map(row => parseInt(row.CREATED_TIME));
        const oldestTime = Math.min(...creationTimes);
        const now = Date.now();
        
        return Math.floor((now - oldestTime) / this.MILLISECONDS_PER_MONTH);
    }

    calculateTrendMetrics(dataframe_2) {
        if (!dataframe_2?.length) return {};

        const now = Date.now();
        const creationTimes = dataframe_2.map(row => parseInt(row.CREATED_TIME));
        const workspaceAge = this.calculateWorkspaceAge(dataframe_2);

        // Monthly buckets for content creation
        const monthlyContent = {};
        creationTimes.forEach(time => {
            const monthKey = Math.floor((now - time) / this.MILLISECONDS_PER_MONTH);
            monthlyContent[monthKey] = (monthlyContent[monthKey] || 0) + 1;
        });

        // Calculate growth rates
        const monthlyGrowthRates = [];
        Object.keys(monthlyContent).sort().forEach((month, index, months) => {
            if (index > 0) {
                const currentMonth = monthlyContent[month];
                const previousMonth = monthlyContent[months[index - 1]];
                const growthRate = ((currentMonth - previousMonth) / previousMonth) * 100;
                monthlyGrowthRates.push(growthRate);
            }
        });

        // Recent periods analysis
        const last30Days = creationTimes.filter(time => (now - time) <= 30 * this.MILLISECONDS_PER_DAY).length;
        const last60Days = creationTimes.filter(time => (now - time) <= 60 * this.MILLISECONDS_PER_DAY).length;
        const last90Days = creationTimes.filter(time => (now - time) <= 90 * this.MILLISECONDS_PER_DAY).length;

        return {
            monthly_growth_rates: monthlyGrowthRates,
            blocks_created_last_month: monthlyContent[0] || 0,
            blocks_created_last_year: workspaceAge >= 12 ? 
                Object.values(monthlyContent).slice(0, 12).reduce((sum, count) => sum + count, 0) : 
                "workspace currently too young",
            content_growth_trend: monthlyGrowthRates.slice(-3),
            growth_acceleration: this.calculateGrowthAcceleration(monthlyGrowthRates),
            creation_velocity: this.calculateCreationVelocity(monthlyContent),
            content_created_30d: last30Days,
            content_created_60d: last60Days,
            content_created_90d: last90Days,
            avg_daily_creation_30d: last30Days / 30,
            avg_daily_creation_60d: last60Days / 60,
            avg_daily_creation_90d: last90Days / 90,
            workspace_maturity: this.determineWorkspaceMaturity(workspaceAge, monthlyGrowthRates)
        };
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

    calculateGrowthAcceleration(monthlyGrowthRates) {
        if (monthlyGrowthRates.length < 2) return 0;
        
        const recentRates = monthlyGrowthRates.slice(-2);
        return recentRates[1] - recentRates[0];
    }

    calculateCreationVelocity(monthlyContent) {
        const recentMonths = Object.values(monthlyContent).slice(0, 3);
        return recentMonths.reduce((sum, count) => sum + count, 0) / recentMonths.length;
    }

    determineWorkspaceMaturity(workspaceAge, growthRates) {
        if (workspaceAge < 3) return 'New';
        if (workspaceAge < 6) return 'Growing';
        if (workspaceAge < 12) return 'Established';
        return 'Mature';
    }

    calculateCollectionHealthScore(dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS;
        const viewsRatio = dataframe_3.TOTAL_NUM_COLLECTION_VIEWS / (dataframe_3.NUM_COLLECTIONS * 2); // Assuming 2 views per collection is good
        return (aliveRatio * 0.6 + Math.min(1, viewsRatio) * 0.4) * 100;
    }

    calculateContentHealthScore(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS;
        const depthScore = 1 - (this.calculateAverageDepth(dataframe_2) / 10); // Penalize deep nesting
        const orphanedRatio = 1 - (this.countOrphanedBlocks(dataframe_2) / dataframe_2.length);
        
        return (aliveRatio * 0.4 + depthScore * 0.3 + orphanedRatio * 0.3) * 100;
    }

    calculateAverageDepth(dataframe_2) {
        if (!dataframe_2?.length) return 0;
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
    }

    countOrphanedBlocks(dataframe_2) {
        if (!dataframe_2?.length) return 0;
        return dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;
    }

    calculateContentDiversityScore(typeDistribution) {
        const total = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
        const typeRatios = Object.values(typeDistribution).map(count => count / total);
        
        // Calculate Shannon Diversity Index
        return -typeRatios.reduce((sum, ratio) => sum + (ratio * Math.log(ratio)), 0) * 100;
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

        const orphaned_pages = dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;

        return {
            root_pages,
            orphaned_pages,
            navigation_score: Math.max(0, 100 - (orphaned_pages / dataframe_3.TOTAL_NUM_TOTAL_PAGES * 100))
        };
    }

    calculateTeamMetrics(dataframe_3, dataframe_5) {
        return {
            total_members: dataframe_3.TOTAL_NUM_MEMBERS,
            total_guests: dataframe_3.TOTAL_NUM_GUESTS,
            member_growth: ((dataframe_3.TOTAL_NUM_MEMBERS - dataframe_5.NUM_MEMBERS) / dataframe_5.NUM_MEMBERS) * 100,
            teamspaces: {
                total: dataframe_3.TOTAL_NUM_TEAMSPACES,
                open: dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES,
                closed: dataframe_3.TOTAL_NUM_CLOSED_TEAMSPACES,
                private: dataframe_3.TOTAL_NUM_PRIVATE_TEAMSPACES
            },
            automation: {
                total_bots: dataframe_3.TOTAL_NUM_BOTS,
                internal_bots: dataframe_3.TOTAL_NUM_INTERNAL_BOTS,
                public_bots: dataframe_3.TOTAL_NUM_PUBLIC_BOTS,
                integrations: dataframe_3.TOTAL_NUM_INTEGRATIONS
            },
            team_efficiency_score: this.calculateTeamEfficiencyScore(dataframe_3)
        };
    }

    calculateHealthScore(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const publicRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const collectionHealth = dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS;
        
        return (aliveRatio * 0.4 + publicRatio * 0.3 + collectionHealth * 0.3) * 100;
    }

    calculateTeamEfficiencyScore(dataframe_3) {
        const automationRatio = (dataframe_3.TOTAL_NUM_BOTS + dataframe_3.TOTAL_NUM_INTEGRATIONS) / dataframe_3.TOTAL_NUM_MEMBERS;
        const teamspaceUtilization = dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1);
        
        return Math.min(100, (automationRatio * 50) + (teamspaceUtilization / this.INDUSTRY_AVERAGE_TEAM_SIZE * 50));
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

    calculateUsageMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3 || !dataframe_5) {
            console.warn('No usage data available');
            return {};
        }

        const total_num_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const total_num_guests = dataframe_3.TOTAL_NUM_GUESTS || 0;
        const total_num_teamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        const total_num_integrations = dataframe_3.TOTAL_NUM_INTEGRATIONS || 0;
        const total_num_bots = dataframe_3.TOTAL_NUM_BOTS || 0;

        const average_teamspace_members = total_num_teamspaces ? 
            total_num_members / total_num_teamspaces : 0;
        
        const automation_usage_rate = total_num_members ? 
            (total_num_bots / total_num_members) * 100 : 0;
        
        const current_integration_coverage = 
            (total_num_integrations / this.RECOMMENDED_INTEGRATIONS) * 100;
        
        const automation_efficiency_gain = 
            (automation_usage_rate * 0.1) + (current_integration_coverage * 0.15);

        return {
            total_num_members,
            total_num_guests,
            total_num_teamspaces,
            total_num_integrations,
            total_num_bots,
            average_teamspace_members,
            automation_usage_rate,
            current_integration_coverage,
            automation_efficiency_gain
        };
    }

    calculateGrowthMetrics(dataframe_3, dataframe_2, dataframe_5) {
        if (!dataframe_3 || !dataframe_2?.length || !dataframe_5?.length) {
            console.warn('No growth data available');
            return {};
        }

        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

        // Count nodes created in different time periods
        const nodesLast30Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > thirtyDaysAgo
        ).length;

        const nodesLast60Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > sixtyDaysAgo
        ).length;

        const nodesLast90Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > ninetyDaysAgo
        ).length;

        // Calculate monthly growth rates
        const monthly_content_growth_rate = (nodesLast30Days / dataframe_2.length) * 100;
        
        // Calculate 60-day vs 30-day growth trend
        const growth_trend_60d = ((nodesLast60Days - nodesLast30Days) / nodesLast30Days) * 100;
        
        // Calculate 90-day vs 60-day growth trend
        const growth_trend_90d = ((nodesLast90Days - nodesLast60Days) / nodesLast60Days) * 100;

        // User metrics
        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        
        // Estimate member growth based on content growth (assuming correlation)
        const monthly_member_growth_rate = Math.min(monthly_content_growth_rate * 0.5, 10); // Cap at 10%
        
        const growth_capacity = 
            (monthly_member_growth_rate * 0.6) + (monthly_content_growth_rate * 0.4);
        
        const expected_members_in_next_year = 
            total_members * Math.pow(1 + (monthly_member_growth_rate/100), 12);

        // Calculate daily creation averages
        const avg_daily_creation_30d = nodesLast30Days / 30;
        const avg_daily_creation_60d = nodesLast60Days / 60;
        const avg_daily_creation_90d = nodesLast90Days / 90;

        return {
            monthly_member_growth_rate,
            monthly_content_growth_rate,
            growth_capacity,
            expected_members_in_next_year,
            nodes_created_last_30_days: nodesLast30Days,
            nodes_created_last_60_days: nodesLast60Days,
            nodes_created_last_90_days: nodesLast90Days,
            avg_daily_creation_30d,
            avg_daily_creation_60d,
            avg_daily_creation_90d,
            growth_trend_60d,
            growth_trend_90d
        };
    }

    calculateOrganizationMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3 || !dataframe_5) {
            console.warn('No organization data available');
            return {};
        }

        const total_pages = dataframe_3.TOTAL_NUM_TOTAL_PAGES || 0;
        const public_pages = dataframe_3.TOTAL_NUM_PUBLIC_PAGES || 0;
        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const total_teamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;

        // Calculate visibility score based on public vs private pages
        const current_visibility_score = (public_pages / total_pages) * 100;

        // Calculate collaboration score based on teamspaces and members
        const current_collaboration_score = total_teamspaces ? 
            Math.min(100, (total_members / total_teamspaces / this.INDUSTRY_AVERAGE_TEAM_SIZE) * 100) : 0;

        // Calculate productivity score based on pages per member
        const pages_per_member = total_members ? total_pages / total_members : 0;
        const current_productivity_score = Math.min(100, (pages_per_member / 10) * 100);

        // Calculate overall organization score
        const current_organization_score = 
            (current_visibility_score * 0.3) + 
            (current_collaboration_score * 0.3) + 
            (current_productivity_score * 0.4);

        return {
            current_visibility_score,
            current_collaboration_score,
            current_productivity_score,
            current_organization_score
        };
    }

    calculateROIMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3 || !dataframe_5) {
            console.warn('No ROI data available');
            return {};
        }

        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;

        // Calculate plan costs
        const current_plan = this.calculatePlanCost(total_members, 'team');
        const enterprise_plan = this.calculatePlanCost(total_members, 'enterprise');
        const enterprise_plan_w_ai = this.calculatePlanCost(total_members, 'enterprise_ai');

        // Calculate productivity gains
        const productivity_10_percent = this.calculateProductivityGain(total_members, 0.1);
        const productivity_20_percent = this.calculateProductivityGain(total_members, 0.2);
        const productivity_50_percent = this.calculateProductivityGain(total_members, 0.5);

        // Calculate ROI
        const enterprise_plan_roi = ((productivity_20_percent - enterprise_plan) / enterprise_plan) * 100;
        const enterprise_plan_w_ai_roi = ((productivity_50_percent - enterprise_plan_w_ai) / enterprise_plan_w_ai) * 100;

        return {
            current_plan,
            enterprise_plan,
            enterprise_plan_w_ai,
            '10_percent_increase': productivity_10_percent,
            '20_percent_increase': productivity_20_percent,
            '50_percent_increase': productivity_50_percent,
            enterprise_plan_roi,
            enterprise_plan_w_ai_roi
        };
    }

    // Add new method for engagement metrics
    calculateEngagementMetrics(dataframe_5) {
        if (!dataframe_5?.length) {
            console.warn('No engagement data available');
            return {};
        }

        // Calculate engagement metrics from dataframe_5
        const totalInteractions = dataframe_5.reduce((sum, row) => sum + (row.INTERACTION_COUNT || 0), 0);
        const uniqueUsers = new Set(dataframe_5.map(row => row.USER_ID)).size;
        const totalPages = new Set(dataframe_5.map(row => row.PAGE_ID)).size;

        // Calculate average interactions per user and page
        const avgInteractionsPerUser = uniqueUsers ? totalInteractions / uniqueUsers : 0;
        const avgInteractionsPerPage = totalPages ? totalInteractions / totalPages : 0;

        // Calculate daily active users (DAU)
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const dau = new Set(
            dataframe_5
                .filter(row => parseInt(row.LAST_INTERACTION_TIME) > oneDayAgo)
                .map(row => row.USER_ID)
        ).size;

        // Calculate monthly active users (MAU)
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const mau = new Set(
            dataframe_5
                .filter(row => parseInt(row.LAST_INTERACTION_TIME) > thirtyDaysAgo)
                .map(row => row.USER_ID)
        ).size;

        // Calculate engagement rate
        const engagementRate = mau ? (dau / mau) * 100 : 0;

        // Calculate page popularity distribution
        const pageInteractions = {};
        dataframe_5.forEach(row => {
            const pageId = row.PAGE_ID;
            pageInteractions[pageId] = (pageInteractions[pageId] || 0) + (row.INTERACTION_COUNT || 0);
        });

        const popularPages = Object.values(pageInteractions).filter(count => count > 100).length;
        const engagementScore = Math.min(100, (popularPages / totalPages) * 100);

        return {
            total_interactions: totalInteractions,
            unique_users: uniqueUsers,
            engaged_pages: totalPages,
            avg_interactions_per_user: avgInteractionsPerUser,
            avg_interactions_per_page: avgInteractionsPerPage,
            daily_active_users: dau,
            monthly_active_users: mau,
            engagement_rate: engagementRate,
            popular_pages: popularPages,
            engagement_score: engagementScore
        };
    }

    // Helper methods
    calculateDepths(dataframe_2) {
        const depths = new Array(dataframe_2.length).fill(0);
        const visited = new Set();

        const calculateDepth = (pageId, depth = 0) => {
            if (visited.has(pageId)) return depth;
            visited.add(pageId);

            const page = dataframe_2.find(p => p.id === pageId);
            if (!page) return depth;

            depths[dataframe_2.indexOf(page)] = depth;

            if (page.child_ids) {
                page.child_ids.forEach(childId => {
                    calculateDepth(childId, depth + 1);
                });
            }

            return depth;
        };

        dataframe_2.forEach(page => {
            if (!page.parent_id) {
                calculateDepth(page.id);
            }
        });

        return depths;
    }

    calculatePlanCost(members, plan) {
        const rates = {
            team: 10,
            enterprise: 20,
            enterprise_ai: 25
        };

        return members * rates[plan] * 12; // Annual cost
    }

    calculateProductivityGain(members, improvement) {
        const avgSalary = 80000; // Assumed average salary
        const workingHours = 2080; // Annual working hours
        const hourlyRate = avgSalary / workingHours;
        
        return members * workingHours * hourlyRate * improvement;
    }

    // Main method to get formatted metrics for PDF
    getFormattedMetrics(dataframe_2, dataframe_3) {
        const metrics = this.calculateAllMetrics(dataframe_2, dataframe_3);
        return this.formatMetricsForPDF(metrics);
    }

    formatMetricsForPDF(metrics) {
        return {
            // Structure metrics with PDF-friendly keys
            TOTAL_PAGES: this.formatNumber(metrics.total_pages),
            MAX_DEPTH: this.formatNumber(metrics.max_depth),
            AVG_DEPTH: this.formatDecimal(metrics.avg_depth),
            DEEP_PAGES: this.formatNumber(metrics.deep_pages_count),
            ROOT_PAGES: this.formatNumber(metrics.root_pages),
            COLLECTIONS: this.formatNumber(metrics.collections_count),
            DUPLICATES: this.formatNumber(metrics.duplicate_count),
            BOTTLENECKS: this.formatNumber(metrics.bottleneck_count),
            UNLINKED_PCT: this.formatPercentage(metrics.percentage_unlinked),
            SCATTER_INDEX: this.formatDecimal(metrics.scatter_index),
            UNFINDABLE: this.formatNumber(metrics.unfindable_pages),
            NAV_SCORE: this.formatDecimal(metrics.nav_depth_score),
            NAV_COMPLEXITY: this.formatDecimal(metrics.nav_complexity),

            // Usage metrics
            TOTAL_MEMBERS: this.formatNumber(metrics.total_num_members),
            TOTAL_GUESTS: this.formatNumber(metrics.total_num_guests),
            TOTAL_TEAMSPACES: this.formatNumber(metrics.total_num_teamspaces),
            TOTAL_INTEGRATIONS: this.formatNumber(metrics.total_num_integrations),
            TOTAL_BOTS: this.formatNumber(metrics.total_num_bots),
            AVG_TEAMSPACE_MEMBERS: this.formatDecimal(metrics.average_teamspace_members),
            AUTOMATION_RATE: this.formatPercentage(metrics.automation_usage_rate),
            INTEGRATION_COVERAGE: this.formatPercentage(metrics.current_integration_coverage),
            EFFICIENCY_GAIN: this.formatPercentage(metrics.automation_efficiency_gain),

            // Growth metrics
            MEMBER_GROWTH: this.formatPercentage(metrics.monthly_member_growth_rate),
            CONTENT_GROWTH: this.formatPercentage(metrics.monthly_content_growth_rate),
            GROWTH_CAPACITY: this.formatPercentage(metrics.growth_capacity),
            PROJECTED_MEMBERS: this.formatNumber(metrics.expected_members_in_next_year),
            NODES_30D: this.formatNumber(metrics.nodes_created_last_30_days),
            NODES_60D: this.formatNumber(metrics.nodes_created_last_60_days),
            NODES_90D: this.formatNumber(metrics.nodes_created_last_90_days),
            AVG_DAILY_30D: this.formatDecimal(metrics.avg_daily_creation_30d),
            AVG_DAILY_60D: this.formatDecimal(metrics.avg_daily_creation_60d),
            AVG_DAILY_90D: this.formatDecimal(metrics.avg_daily_creation_90d),
            GROWTH_TREND_60D: this.formatPercentage(metrics.growth_trend_60d),
            GROWTH_TREND_90D: this.formatPercentage(metrics.growth_trend_90d),

            // Organization metrics
            VISIBILITY_SCORE: this.formatPercentage(metrics.current_visibility_score),
            COLLAB_SCORE: this.formatPercentage(metrics.current_collaboration_score),
            PROD_SCORE: this.formatPercentage(metrics.current_productivity_score),
            ORG_SCORE: this.formatPercentage(metrics.current_organization_score),

            // ROI metrics
            CURRENT_PLAN_COST: this.formatCurrency(metrics.current_plan),
            ENTERPRISE_COST: this.formatCurrency(metrics.enterprise_plan),
            ENTERPRISE_AI_COST: this.formatCurrency(metrics.enterprise_plan_w_ai),
            PRODUCTIVITY_10: this.formatCurrency(metrics['10_percent_increase']),
            PRODUCTIVITY_20: this.formatCurrency(metrics['20_percent_increase']),
            PRODUCTIVITY_50: this.formatCurrency(metrics['50_percent_increase']),
            ENTERPRISE_ROI: this.formatPercentage(metrics.enterprise_plan_roi),
            ENTERPRISE_AI_ROI: this.formatPercentage(metrics.enterprise_plan_w_ai_roi)
        };
    }

    // Formatting helper methods
    formatNumber(value) {
        if (value === null || value === undefined) return 'N/A';
        return Math.round(value).toLocaleString();
    }

    formatDecimal(value) {
        if (value === null || value === undefined) return 'N/A';
        return value.toFixed(1);
    }

    formatPercentage(value) {
        if (value === null || value === undefined) return 'N/A';
        return value.toFixed(1) + '%';
    }

    formatCurrency(value) {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    logMetricsWithPlaceholders(metrics, dataframe_2, dataframe_3, dataframe_5) {
        const placeholderMetrics = {
            // Existing metrics
            '[[total_pages]]': metrics.total_pages,
            '[[max_depth]]': metrics.max_depth,
            '[[avg_depth]]': this.formatDecimal(metrics.avg_depth),
            '[[deep_pages_count]]': metrics.deep_pages_count,
            '[[root_pages]]': metrics.root_pages,
            '[[orphaned_blocks]]': metrics.orphaned_blocks,
            '[[percentage_unlinked]]': this.formatPercentage(metrics.percentage_unlinked),
            '[[collections_count]]': metrics.collections_count,
            '[[page_count]]': metrics.page_count,
            '[[collection_views]]': dataframe_3.TOTAL_NUM_COLLECTION_VIEWS,
            '[[nav_depth_score]]': this.formatDecimal(metrics.nav_depth_score),
            '[[scatter_index]]': this.formatDecimal(metrics.scatter_index),
            '[[bottleneck_count]]': metrics.bottleneck_count,
            '[[duplicate_count]]': metrics.duplicate_count,
            '[[unfindable_pages]]': metrics.unfindable_pages,
            '[[nav_complexity]]': this.formatDecimal(metrics.nav_complexity),
            
            // Evolution Metrics
            '[[content_maturity_score]]': this.formatDecimal(metrics.content_maturity_score),
            '[[growth_sustainability_index]]': this.formatDecimal(metrics.growth_sustainability_index),
            '[[workspace_complexity_score]]': this.formatDecimal(metrics.workspace_complexity?.overall_complexity),
            '[[knowledge_structure_score]]': this.formatDecimal(metrics.knowledge_structure_score),

            // Collaboration Patterns
            '[[team_adoption_score]]': this.formatDecimal(metrics.team_adoption_score),
            '[[collaboration_density]]': this.formatDecimal(metrics.collaboration_density?.density_score),
            '[[knowledge_sharing_index]]': this.formatDecimal(metrics.knowledge_sharing_index),
            '[[cross_team_collaboration_score]]': this.formatDecimal(metrics.cross_team_collaboration_score),

            // Content Quality Metrics
            '[[content_freshness_score]]': this.formatDecimal(metrics.content_freshness_score),
            '[[structure_quality_index]]': this.formatDecimal(metrics.structure_quality_index),
            '[[knowledge_base_health]]': this.formatDecimal(metrics.knowledge_base_health),
            '[[content_organization_score]]': this.formatDecimal(metrics.content_organization_score),
            '[[documentation_coverage]]': this.formatDecimal(metrics.documentation_coverage),

            // Usage Patterns
            '[[automation_effectiveness]]': this.formatDecimal(metrics.automation_effectiveness),
            '[[integration_impact_score]]': this.formatDecimal(metrics.integration_impact_score),
            '[[feature_utilization_index]]': this.formatDecimal(metrics.feature_utilization_index),
            '[[advanced_features_adoption]]': this.formatDecimal(metrics.advanced_features_adoption),
            '[[workflow_optimization_score]]': this.formatDecimal(metrics.workflow_optimization_score),

            // Predictive Metrics
            '[[growth_trajectory]]': this.formatDecimal(metrics.growth_trajectory),
            '[[scaling_readiness_score]]': this.formatDecimal(metrics.scaling_readiness_score),
            '[[bottleneck_prediction]]': metrics.bottleneck_prediction,
            '[[growth_potential_score]]': this.formatDecimal(metrics.growth_potential_score),
            '[[optimization_opportunities]]': metrics.optimization_opportunities,

            // Trend Metrics
            '[[monthly_growth_rates]]': this.formatDecimal(metrics.monthly_growth_rates?.[0]),
            '[[blocks_created_last_month]]': metrics.blocks_created_last_month,
            '[[blocks_created_last_year]]': metrics.blocks_created_last_year,
            '[[content_growth_trend]]': this.formatDecimal(metrics.content_growth_trend?.[0]),
            '[[growth_acceleration]]': this.formatDecimal(metrics.growth_acceleration),
            '[[creation_velocity]]': this.formatDecimal(metrics.creation_velocity),
            '[[workspace_maturity]]': metrics.workspace_maturity,

            // Collection Metrics
            '[[total_collections]]': metrics.total_collections,
            '[[linked_database_count]]': metrics.linked_database_count,
            '[[standalone_database_count]]': metrics.standalone_database_count,
            '[[avg_items_per_collection]]': this.formatDecimal(metrics.avg_items_per_collection),
            '[[collection_usage_ratio]]': this.formatDecimal(metrics.collection_usage_ratio),
            '[[collection_health_score]]': this.formatDecimal(metrics.collection_health_score),
            '[[template_count]]': metrics.template_count,

            // Content Type Metrics
            '[[content_type_distribution]]': JSON.stringify(metrics.content_type_distribution),
            '[[duplicate_content_rate]]': this.formatPercentage(metrics.duplicate_content_rate),
            '[[content_health_score]]': this.formatDecimal(metrics.content_health_score),
            '[[avg_content_per_type]]': this.formatDecimal(metrics.avg_content_per_type),
            '[[content_diversity_score]]': this.formatDecimal(metrics.content_diversity_score),

            // Key Metrics Insights
            '[[key_metrics_insight_1]]': this.formatPercentage(metrics.monthly_content_growth_rate),
            '[[key_metrics_insight_2]]': this.formatPercentage(metrics.monthly_member_growth_rate),
            '[[key_metrics_insight_3]]': this.formatDecimal(dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS),
            '[[key_metrics_insight_4]]': dataframe_3.TOTAL_NUM_MEMBERS + dataframe_3.TOTAL_NUM_GUESTS,
            '[[key_metrics_insight_5]]': this.formatDecimal(dataframe_3.TOTAL_NUM_MEMBERS / dataframe_3.TOTAL_NUM_TEAMSPACES),
            '[[key_metrics_insight_6]]': this.formatDecimal(dataframe_3.NUM_ALIVE_PAGES / dataframe_3.TOTAL_NUM_MEMBERS),
            '[[key_metrics_insight_7]]': this.formatPercentage((dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS) * 100),
            '[[key_metrics_insight_8]]': this.formatPercentage((dataframe_3.NUM_ALIVE_COLLECTIONS / dataframe_3.NUM_COLLECTIONS) * 100),
            '[[key_metrics_insight_9]]': this.formatDecimal(dataframe_3.NUM_BLOCKS / dataframe_3.TOTAL_NUM_TEAMSPACES),
            '[[key_metrics_insight_10]]': dataframe_3.TOTAL_NUM_INTEGRATIONS,
            '[[key_metrics_insight_11]]': dataframe_3.TOTAL_NUM_BOTS + dataframe_3.TOTAL_NUM_INTERNAL_BOTS + dataframe_3.TOTAL_NUM_PUBLIC_BOTS,
            '[[key_metrics_insight_12]]': dataframe_3.TOTAL_NUM_LINK_PREVIEW_INTEGRATIONS + dataframe_3.TOTAL_NUM_PUBLIC_INTEGRATIONS,
            '[[key_metrics_insight_13]]': this.formatPercentage((dataframe_3.NUM_ALIVE_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100)
        };

        console.log('Metrics with placeholders:', placeholderMetrics);
        return placeholderMetrics;
    }

    async createNotionEntry(workspaceId, metrics) {
        try {
            const response = await fetch('/api/notion/create-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workspaceId,
                    metrics
                })
            });

            const result = await response.json();
            console.log("Success! Notion entry created:", result);
            return result;
        } catch (error) {
            console.error("Error creating Notion entry:", error);
            throw error;
        }
    }

    calculateAdvancedMetrics(dataframe_2, dataframe_3, dataframe_5) {
        const evolutionMetrics = this.calculateEvolutionMetrics(dataframe_2, dataframe_3);
        const collaborationPatterns = this.calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5);
        const contentQualityMetrics = this.calculateContentQualityMetrics(dataframe_2, dataframe_3);
        const usagePatterns = this.calculateAdvancedUsagePatterns(dataframe_2, dataframe_3, dataframe_5);
        const predictiveMetrics = this.calculatePredictiveMetrics(dataframe_2, dataframe_3);

        return {
            ...evolutionMetrics,
            ...collaborationPatterns,
            ...contentQualityMetrics,
            ...usagePatterns,
            ...predictiveMetrics
        };
    }

    calculateEvolutionMetrics(dataframe_2, dataframe_3) {
        const workspaceAge = this.calculateWorkspaceAge(dataframe_2);
        const depthStats = this.calculateDepthStatistics(dataframe_2);
        const contentDiversity = this.calculateContentDiversityScore(this.getTypeDistribution(dataframe_2));

        return {
            content_maturity_score: this.calculateContentMaturityScore(workspaceAge, depthStats, contentDiversity),
            growth_sustainability_index: this.calculateGrowthSustainability(dataframe_2, dataframe_3),
            workspace_complexity_score: this.calculateWorkspaceComplexity(dataframe_2, dataframe_3),
            knowledge_structure_score: this.calculateKnowledgeStructure(dataframe_2, dataframe_3)
        };
    }

    calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5) {
        const teamspaceMetrics = this.analyzeTeamspacePatterns(dataframe_3);
        const memberActivity = this.analyzeMemberActivity(dataframe_2, dataframe_3);
        
        return {
            team_adoption_score: this.calculateTeamAdoptionScore(memberActivity, teamspaceMetrics),
            collaboration_density: this.calculateCollaborationDensity(dataframe_3),
            knowledge_sharing_index: this.calculateKnowledgeSharingIndex(dataframe_2, dataframe_3),
            cross_team_collaboration_score: this.calculateCrossTeamCollaboration(dataframe_3),
            team_content_distribution: this.analyzeTeamContentDistribution(dataframe_2, dataframe_3)
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

    calculateAdvancedUsagePatterns(dataframe_2, dataframe_3, dataframe_5) {
        return {
            automation_effectiveness: this.calculateAutomationEffectiveness(dataframe_3),
            integration_impact_score: this.calculateIntegrationImpact(dataframe_3),
            feature_utilization_index: this.calculateFeatureUtilization(dataframe_2, dataframe_3),
            advanced_features_adoption: this.calculateAdvancedFeaturesAdoption(dataframe_2),
            workflow_optimization_score: this.calculateWorkflowOptimization(dataframe_3)
        };
    }

    calculatePredictiveMetrics(dataframe_2, dataframe_3) {
        const growthPatterns = this.analyzeGrowthPatterns(dataframe_2);
        const usagePatterns = this.analyzeUsagePatterns(dataframe_2, dataframe_3);

        return {
            growth_trajectory: this.calculateGrowthTrajectory(growthPatterns),
            scaling_readiness_score: this.calculateScalingReadiness(dataframe_2, dataframe_3),
            bottleneck_prediction: this.predictBottlenecks(usagePatterns),
            growth_potential_score: this.calculateGrowthPotential(dataframe_2, dataframe_3),
            optimization_opportunities: this.identifyOptimizationOpportunities(dataframe_2, dataframe_3)
        };
    }

    // Helper methods for new metrics
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
        const thirtyDaysAgo = now - (30 * this.MILLISECONDS_PER_DAY);
        const ninetyDaysAgo = now - (90 * this.MILLISECONDS_PER_DAY);

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
            this.calculateAverageDepth(dataframe_2),
            dataframe_2.filter(row => (row.DEPTH || 0) > this.DEEP_PAGE_THRESHOLD).length,
            this.countOrphanedPages(dataframe_2),
            dataframe_2.length
        );
        
        return (aliveRatio * 50 + structureScore / 100 * 50);
    }

    calculateOrganizationScore(dataframe_2) {
        const templateRatio = dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length;
        const collectionRatio = dataframe_2.filter(row => row.TYPE === 'collection_view_page').length / dataframe_2.length;
        const avgDepth = this.calculateAverageDepth(dataframe_2);
        const depthScore = Math.max(0, 100 - (avgDepth * 10));

        return (templateRatio * 30 + collectionRatio * 40 + depthScore * 0.3);
    }

    calculateWorkspaceComplexity(dataframe_2, dataframe_3) {
        const depthComplexity = this.calculateDepthComplexity(dataframe_2);
        const navigationComplexity = this.calculateNavigationComplexity(dataframe_2);
        const contentComplexity = this.calculateContentComplexity(dataframe_2, dataframe_3);

        return {
            overall_complexity: (depthComplexity + navigationComplexity + contentComplexity) / 3,
            depth_complexity: depthComplexity,
            navigation_complexity: navigationComplexity,
            content_complexity: contentComplexity
        };
    }

    calculateDepthComplexity(dataframe_2) {
        const avgDepth = this.calculateAverageDepth(dataframe_2);
        const maxDepth = Math.max(...dataframe_2.map(row => row.DEPTH || 0));
        return Math.min(100, (avgDepth * 10 + maxDepth * 5));
    }

    calculateNavigationComplexity(dataframe_2) {
        const orphanedRatio = this.countOrphanedPages(dataframe_2) / dataframe_2.length;
        const deepPagesRatio = dataframe_2.filter(row => (row.DEPTH || 0) > this.DEEP_PAGE_THRESHOLD).length / dataframe_2.length;
        return Math.min(100, (orphanedRatio * 50 + deepPagesRatio * 50) * 100);
    }

    calculateContentComplexity(dataframe_2, dataframe_3) {
        const typeDistribution = this.getTypeDistribution(dataframe_2);
        const typeCount = Object.keys(typeDistribution).length;
        const collectionRatio = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return Math.min(100, (typeCount * 10 + collectionRatio * 50));
    }

    // Depth and Structure Analysis Methods
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
            deepPagesCount: depths.filter(d => d > this.DEEP_PAGE_THRESHOLD).length
        };
    }

    getTypeDistribution(dataframe_2) {
        const typeCount = {};
        dataframe_2.forEach(row => {
            const type = row.TYPE || 'unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return typeCount;
    }

    // Team and Collaboration Analysis Methods
    analyzeTeamspacePatterns(dataframe_3) {
        return {
            total_teamspaces: dataframe_3.TOTAL_NUM_TEAMSPACES,
            open_teamspaces: dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES,
            closed_teamspaces: dataframe_3.TOTAL_NUM_CLOSED_TEAMSPACES,
            private_teamspaces: dataframe_3.TOTAL_NUM_PRIVATE_TEAMSPACES,
            avg_members_per_teamspace: dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1),
            teamspace_utilization: (dataframe_3.TOTAL_NUM_TEAMSPACES / Math.ceil(dataframe_3.TOTAL_NUM_MEMBERS / this.INDUSTRY_AVERAGE_TEAM_SIZE)) * 100
        };
    }

    analyzeMemberActivity(dataframe_2, dataframe_3) {
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * this.MILLISECONDS_PER_DAY);
        const activePages = dataframe_2.filter(row => parseInt(row.CREATED_TIME) > thirtyDaysAgo).length;

        return {
            total_members: dataframe_3.TOTAL_NUM_MEMBERS,
            active_pages_per_member: activePages / dataframe_3.TOTAL_NUM_MEMBERS,
            content_per_member: dataframe_3.NUM_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS,
            collections_per_member: dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_MEMBERS
        };
    }

    calculateTeamAdoptionScore(memberActivity, teamspaceMetrics) {
        const contentScore = Math.min(memberActivity.content_per_member / 10, 1) * 100;
        const teamspaceScore = Math.min(teamspaceMetrics.teamspace_utilization, 100);
        const activityScore = Math.min(memberActivity.active_pages_per_member * 20, 100);

        return (contentScore * 0.4 + teamspaceScore * 0.3 + activityScore * 0.3);
    }

    calculateCollaborationDensity(dataframe_3) {
        const memberDensity = dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1);
        const optimalDensity = this.INDUSTRY_AVERAGE_TEAM_SIZE;
        const densityScore = Math.min((memberDensity / optimalDensity) * 100, 100);

        return {
            density_score: densityScore,
            members_per_teamspace: memberDensity,
            optimal_density: optimalDensity
        };
    }

    calculateKnowledgeSharingIndex(dataframe_2, dataframe_3) {
        const publicRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const templateRatio = dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length;
        const collectionRatio = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;

        return (publicRatio * 40 + templateRatio * 30 + collectionRatio * 30);
    }

    // Content Analysis Methods
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
            if (age <= this.MILLISECONDS_PER_DAY) timeRanges.last_24h++;
            if (age <= 7 * this.MILLISECONDS_PER_DAY) timeRanges.last_week++;
            if (age <= 30 * this.MILLISECONDS_PER_DAY) timeRanges.last_month++;
            if (age <= 90 * this.MILLISECONDS_PER_DAY) timeRanges.last_quarter++;
        });

        return {
            creation_ranges: timeRanges,
            daily_average: timeRanges.last_month / 30,
            weekly_average: timeRanges.last_week / 7,
            creation_trend: this.calculateCreationTrend(timeRanges)
        };
    }

    analyzeStructureQuality(dataframe_2) {
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        const orphanedPages = this.countOrphanedPages(dataframe_2);
        const avgDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        const deepPages = depths.filter(d => d > this.DEEP_PAGE_THRESHOLD).length;

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

    countOrphanedPages(dataframe_2) {
        return dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;
    }

    calculateCreationTrend(timeRanges) {
        const monthlyRate = timeRanges.last_month / 30;
        const quarterlyRate = timeRanges.last_quarter / 90;
        return ((monthlyRate - quarterlyRate) / quarterlyRate) * 100;
    }

    calculateCrossTeamCollaboration(dataframe_3) {
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES;
        const openTeamspaces = dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES;
        const sharedContentRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return (openTeamspaces / totalTeamspaces * 50) + (sharedContentRatio * 50);
    }

    analyzeTeamContentDistribution(dataframe_2, dataframe_3) {
        const totalContent = dataframe_3.NUM_BLOCKS;
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES;
        return {
            content_per_teamspace: totalContent / totalTeamspaces,
            distribution_score: Math.min(100, (totalContent / totalTeamspaces / 100) * 100)
        };
    }

    analyzeContentHealth(dataframe_2, dataframe_3) {
        const aliveRatio = dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS;
        const recentContent = dataframe_2.filter(row => {
            const age = Date.now() - parseInt(row.CREATED_TIME);
            return age < 90 * this.MILLISECONDS_PER_DAY;
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

    calculateAutomationEffectiveness(dataframe_3) {
        const automationRatio = (dataframe_3.TOTAL_NUM_BOTS + dataframe_3.TOTAL_NUM_INTEGRATIONS) / 
                               dataframe_3.TOTAL_NUM_MEMBERS;
        return Math.min(100, automationRatio * 100);
    }

    calculateIntegrationImpact(dataframe_3) {
        const integrationRatio = dataframe_3.TOTAL_NUM_INTEGRATIONS / this.RECOMMENDED_INTEGRATIONS;
        const integrationUsage = dataframe_3.TOTAL_NUM_LINK_PREVIEW_INTEGRATIONS / 
                                dataframe_3.TOTAL_NUM_INTEGRATIONS;
        
        return Math.min(100, (integrationRatio * 50) + (integrationUsage * 50));
    }

    calculateFeatureUtilization(dataframe_2, dataframe_3) {
        const advancedFeatures = [
            dataframe_3.NUM_COLLECTIONS,
            dataframe_3.TOTAL_NUM_COLLECTION_VIEWS,
            dataframe_3.TOTAL_NUM_INTEGRATIONS,
            dataframe_3.TOTAL_NUM_BOTS
        ].reduce((sum, count) => sum + count, 0);

        const basicPages = dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        return Math.min(100, (advancedFeatures / basicPages) * 100);
    }

    calculateAdvancedFeaturesAdoption(dataframe_2) {
        const totalPages = dataframe_2.length;
        const advancedPages = dataframe_2.filter(row => 
            row.TYPE === 'collection_view_page' || 
            row.TYPE === 'template' ||
            row.TYPE === 'database'
        ).length;

        return (advancedPages / totalPages) * 100;
    }

    calculateWorkflowOptimization(dataframe_3) {
        const automationScore = this.calculateAutomationEffectiveness(dataframe_3);
        const integrationScore = this.calculateIntegrationImpact(dataframe_3);
        return (automationScore * 0.5 + integrationScore * 0.5);
    }

    analyzeGrowthPatterns(dataframe_2) {
        const now = Date.now();
        const monthlyGrowth = {};
        
        dataframe_2.forEach(row => {
            const month = Math.floor((now - parseInt(row.CREATED_TIME)) / this.MILLISECONDS_PER_MONTH);
            monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
        });

        return {
            monthly_growth: monthlyGrowth,
            growth_rate: Object.values(monthlyGrowth)[0] / 
                        (Object.values(monthlyGrowth)[1] || Object.values(monthlyGrowth)[0]),
            consistency: this.calculateGrowthConsistency(Object.values(monthlyGrowth))
        };
    }

    calculateGrowthConsistency(monthlyValues) {
        if (monthlyValues.length < 2) return 100;
        
        const variations = monthlyValues.slice(1).map((value, index) => 
            Math.abs(value - monthlyValues[index]) / monthlyValues[index]
        );
        
        return Math.max(0, 100 - (average(variations) * 100));
    }

    analyzeUsagePatterns(dataframe_2, dataframe_3) {
        const contentPerMember = dataframe_3.NUM_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS;
        const collectionUsage = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return {
            content_per_member: contentPerMember,
            collection_usage: collectionUsage,
            usage_score: Math.min(100, (contentPerMember / 10) * 50 + (collectionUsage * 50))
        };
    }

    calculateGrowthTrajectory(growthPatterns) {
        return growthPatterns.growth_rate * growthPatterns.consistency;
    }

    calculateScalingReadiness(dataframe_2, dataframe_3) {
        const structureScore = this.calculateStructureQualityIndex(this.analyzeStructureQuality(dataframe_2));
        const automationScore = this.calculateAutomationEffectiveness(dataframe_3);
        const organizationScore = this.calculateOrganizationScore(dataframe_2);
        
        return (structureScore * 0.4 + automationScore * 0.3 + organizationScore * 0.3);
    }

    predictBottlenecks(usagePatterns) {
        const bottlenecks = [];
        
        if (usagePatterns.content_per_member > 100) {
            bottlenecks.push("High content per member ratio - consider restructuring");
        }
        if (usagePatterns.collection_usage < 0.1) {
            bottlenecks.push("Low collection usage - consider implementing more databases");
        }
        
        return bottlenecks.length ? bottlenecks : ["No significant bottlenecks detected"];
    }

    calculateGrowthPotential(dataframe_2, dataframe_3) {
        const currentUtilization = this.analyzeUsagePatterns(dataframe_2, dataframe_3).usage_score;
        const scalingReadiness = this.calculateScalingReadiness(dataframe_2, dataframe_3);
        
        return (currentUtilization * 0.3 + scalingReadiness * 0.7);
    }

    identifyOptimizationOpportunities(dataframe_2, dataframe_3) {
        const opportunities = [];
        
        if (dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES < 0.1) {
            opportunities.push("Increase database usage for better content organization");
        }
        if (dataframe_3.TOTAL_NUM_INTEGRATIONS < this.RECOMMENDED_INTEGRATIONS) {
            opportunities.push("Add more integrations to improve workflow automation");
        }
        if (this.countOrphanedPages(dataframe_2) > dataframe_2.length * 0.1) {
            opportunities.push("Reduce number of orphaned pages");
        }
        
        return opportunities.length ? opportunities : ["No significant optimization opportunities identified"];
    }

    // Helper function for calculating averages
    average(array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    }

    // ... existing methods ...
} 