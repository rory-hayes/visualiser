export class MetricsCalculator {
    constructor() {
        // Constants for calculations
        this.INDUSTRY_AVERAGE_TEAM_SIZE = 8;
        this.RECOMMENDED_INTEGRATIONS = 5;
        this.DEEP_PAGE_THRESHOLD = 5;
        this.BOTTLENECK_THRESHOLD = 10;
        this.SCATTER_THRESHOLD = 0.3;
        this.UNFINDABLE_DEPTH = 4;
    }

    calculateAllMetrics(dataframe_2, dataframe_3) {
        // Log both the summary data and full dataset
        console.log('Data received:', {
            dataframe_2_length: dataframe_2?.length,
            dataframe_3: dataframe_3
        });

        const structureMetrics = this.calculateStructureMetrics(dataframe_2);
        const usageMetrics = this.calculateUsageMetrics(dataframe_3);
        const growthMetrics = this.calculateGrowthMetrics(dataframe_3);
        const organizationMetrics = this.calculateOrganizationMetrics(dataframe_3);
        const roiMetrics = this.calculateROIMetrics(dataframe_3);

        return {
            ...structureMetrics,
            ...usageMetrics,
            ...growthMetrics,
            ...organizationMetrics,
            ...roiMetrics,
            graphData: dataframe_2
        };
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

    calculateGrowthMetrics(dataframe_3) {
        if (!dataframe_3) {
            console.warn('No growth data available');
            return {};
        }

        // Since we don't have historical data, estimate growth based on current metrics
        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const total_blocks = dataframe_3.NUM_BLOCKS || 0;
        
        // Estimate monthly growth rates based on current numbers
        const monthly_member_growth_rate = 5; // Assume 5% monthly growth
        const monthly_content_growth_rate = 8; // Assume 8% monthly growth
        
        const growth_capacity = 
            (monthly_member_growth_rate * 0.6) + (monthly_content_growth_rate * 0.4);
        
        const expected_members_in_next_year = 
            total_members * Math.pow(1 + (monthly_member_growth_rate/100), 12);

        return {
            monthly_member_growth_rate,
            monthly_content_growth_rate,
            growth_capacity,
            expected_members_in_next_year
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
} 