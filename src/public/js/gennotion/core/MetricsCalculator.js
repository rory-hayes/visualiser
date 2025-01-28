export class MetricsCalculator {
    constructor() {
        // Constants for calculations
        this.INDUSTRY_AVERAGE_TEAM_SIZE = 8;
        this.RECOMMENDED_INTEGRATIONS = 5;
        this.DEEP_PAGE_THRESHOLD = 5;
        this.BOTTLENECK_THRESHOLD = 10;
        this.SCATTER_THRESHOLD = 0.3;
        this.UNFINDABLE_DEPTH = 4;

        // Notion API configuration
        this.NOTION_DATABASE_ID = "18730aa1-c7a9-8059-b53e-de31cde8bfc4";
        this.NOTION_API_KEY = "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";
    }

    async calculateAllMetrics(dataframe_2, dataframe_3) {
        // Log both the summary data and full dataset
        console.log('Data received:', {
            dataframe_2_length: dataframe_2?.length,
            dataframe_3: dataframe_3
        });

        const structureMetrics = this.calculateStructureMetrics(dataframe_2);
        const usageMetrics = this.calculateUsageMetrics(dataframe_3);
        const growthMetrics = this.calculateGrowthMetrics(dataframe_3, dataframe_2);
        const organizationMetrics = this.calculateOrganizationMetrics(dataframe_3);
        const roiMetrics = this.calculateROIMetrics(dataframe_3);

        const allMetrics = {
            ...structureMetrics,
            ...usageMetrics,
            ...growthMetrics,
            ...organizationMetrics,
            ...roiMetrics,
            graphData: dataframe_2
        };

        // Log metrics with placeholders
        this.logMetricsWithPlaceholders(allMetrics, dataframe_2, dataframe_3);

        return allMetrics;
    }

    calculateStructureMetrics(dataframe_2) {
        if (!dataframe_2?.length) {
            console.warn('No data available for structure metrics');
            return {};
        }

        // Calculate depth-related metrics from all rows
        const depths = dataframe_2.map(row => row.DEPTH || 0);
        const pageDepths = dataframe_2.map(row => row.PAGE_DEPTH || 0);
        
        const max_depth = Math.max(...depths);
        const avg_depth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        
        const max_page_depth = Math.max(...pageDepths);
        const avg_page_depth = pageDepths.reduce((sum, depth) => sum + depth, 0) / pageDepths.length;

        // Get summary metrics from first row
        const summaryData = dataframe_2[0];
        const total_pages = summaryData.TOTAL_NUM_TOTAL_PAGES || 0;
        const alive_pages = summaryData.TOTAL_NUM_ALIVE_TOTAL_PAGES || 0;
        const collections_count = summaryData.NUM_ALIVE_COLLECTIONS || 0;

        // Calculate page type counts
        const page_count = dataframe_2.filter(row => row.TYPE === 'page').length;
        const collection_view_count = dataframe_2.filter(row => row.TYPE === 'collection_view').length;
        const collection_view_page_count = dataframe_2.filter(row => row.TYPE === 'collection_view_page').length;

        // Calculate root pages (pages with no parent or parent is workspace)
        const root_pages = dataframe_2.filter(row => 
            !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID
        ).length;

        // Calculate orphaned pages (no parent and no children)
        const orphaned_blocks = dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;

        // Calculate duplicate pages (same title)
        const titleCounts = {};
        dataframe_2.forEach(row => {
            const title = row.TEXT || '';
            if (title.trim()) {
                titleCounts[title] = (titleCounts[title] || 0) + 1;
            }
        });
        const duplicate_count = Object.values(titleCounts).filter(count => count > 1).length;

        // Calculate bottleneck pages (pages with many children)
        const bottleneck_count = dataframe_2.filter(row => {
            const childIds = JSON.parse(row.CHILD_IDS || '[]');
            return childIds.length > this.BOTTLENECK_THRESHOLD;
        }).length;

        // Calculate derived metrics
        const deep_pages_count = depths.filter(depth => depth > this.DEEP_PAGE_THRESHOLD).length;
        const percentage_unlinked = (orphaned_blocks / total_pages) * 100;
        const scatter_index = root_pages / total_pages;
        const unfindable_pages = depths.filter(depth => depth > this.UNFINDABLE_DEPTH).length;
        const nav_depth_score = Math.max(0, 100 - (avg_depth * 10));
        const nav_complexity = (bottleneck_count * 5 + unfindable_pages * 3) / total_pages * 100;

        return {
            total_pages,
            max_depth,
            avg_depth,
            max_page_depth,
            avg_page_depth,
            deep_pages_count,
            root_pages,
            orphaned_blocks,
            collections_count,
            page_count,
            collection_view_count,
            collection_view_page_count,
            duplicate_count,
            bottleneck_count,
            percentage_unlinked,
            scatter_index,
            unfindable_pages,
            nav_depth_score,
            nav_complexity
        };
    }

    calculateUsageMetrics(dataframe_3) {
        if (!dataframe_3) {
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

    calculateGrowthMetrics(dataframe_3, dataframe_2) {
        if (!dataframe_3 || !dataframe_2?.length) {
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

    calculateOrganizationMetrics(dataframe_3) {
        if (!dataframe_3) {
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

    calculateROIMetrics(dataframe_3) {
        if (!dataframe_3) {
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

    logMetricsWithPlaceholders(metrics, dataframe_2, dataframe_3) {
        const placeholderMetrics = {
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
            '[[key_metrics_insight_13]]': this.formatPercentage((dataframe_3.NUM_ALIVE_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100),
            '[[key_metrics_insight_14]]': this.formatPercentage((dataframe_3.TOTAL_NUM_PRIVATE_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100),
            '[[key_metrics_insight_15]]': this.formatPercentage((dataframe_3.TOTAL_NUM_COLLECTION_VIEWS / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100),
            '[[key_metrics_insight_16]]': this.formatPercentage((dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.NUM_BLOCKS) * 100),
            '[[key_metrics_insight_17]]': this.formatDecimal(dataframe_3.NUM_ALIVE_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS),
            '[[key_metrics_insight_18]]': this.formatPercentage(metrics.monthly_content_growth_rate),

            // Growth Metrics
            '[[growth_rate]]': this.formatPercentage(metrics.monthly_content_growth_rate),
            '[[monthly_member_growth_rate]]': this.formatPercentage(metrics.monthly_member_growth_rate),
            '[[monthly_content_growth_rate]]': this.formatPercentage(metrics.monthly_content_growth_rate),
            '[[expected_members_in_next_year]]': this.formatNumber(metrics.expected_members_in_next_year),

            // Organization Metrics
            '[[current_visibility_score]]': this.formatPercentage(metrics.current_visibility_score),
            '[[current_collaboration_score]]': this.formatPercentage(metrics.current_collaboration_score),
            '[[current_productivity_score]]': this.formatPercentage(metrics.current_productivity_score),
            '[[current_organization_score]]': this.formatPercentage(metrics.current_organization_score),
            '[[projected_organisation_score]]': this.formatPercentage(metrics.current_organization_score * 1.3),

            // ROI Metrics
            '[[current_plan]]': this.formatCurrency(metrics.current_plan),
            '[[enterprise_plan]]': this.formatCurrency(metrics.enterprise_plan),
            '[[enterprise_plan_w_ai]]': this.formatCurrency(metrics.enterprise_plan_w_ai),
            '[[10_percent_increase]]': this.formatCurrency(metrics['10_percent_increase']),
            '[[20_percent_increase]]': this.formatCurrency(metrics['20_percent_increase']),
            '[[50_percent_increase]]': this.formatCurrency(metrics['50_percent_increase']),
            '[[enterprise_plan_roi]]': this.formatPercentage(metrics.enterprise_plan_roi),
            '[[enterprise_plan_w_ai_roi]]': this.formatPercentage(metrics.enterprise_plan_w_ai_roi)
        };

        console.log('\nMetrics with Placeholders:');
        Object.entries(placeholderMetrics).forEach(([placeholder, value]) => {
            console.log(`${placeholder} -> ${value}`);
        });
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
} 