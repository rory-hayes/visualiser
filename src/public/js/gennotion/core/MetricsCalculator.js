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
        console.log('Calculating metrics with:', {
            df2_length: dataframe_2?.length,
            df3_available: !!dataframe_3
        });

        const structureMetrics = this.calculateStructureMetrics(dataframe_2);
        const usageMetrics = this.calculateUsageMetrics(dataframe_2, dataframe_3);
        const growthMetrics = this.calculateGrowthMetrics(dataframe_2, dataframe_3);
        const organizationMetrics = this.calculateOrganizationMetrics(dataframe_2, dataframe_3);
        const roiMetrics = this.calculateROIMetrics(dataframe_2, dataframe_3);

        return {
            ...structureMetrics,
            ...usageMetrics,
            ...growthMetrics,
            ...organizationMetrics,
            ...roiMetrics
        };
    }

    calculateStructureMetrics(dataframe_2) {
        if (!dataframe_2?.length) {
            console.warn('No data available for structure metrics');
            return {};
        }

        const depths = this.calculateDepths(dataframe_2);
        const total_pages = dataframe_2.length;
        const max_depth = Math.max(...depths);
        const avg_depth = depths.reduce((a, b) => a + b, 0) / depths.length;
        const deep_pages_count = depths.filter(d => d > this.DEEP_PAGE_THRESHOLD).length;
        
        const root_pages = dataframe_2.filter(page => !page.parent_id).length;
        const orphaned_blocks = dataframe_2.filter(page => !page.parent_id && !page.child_ids?.length).length;
        
        const collections_count = dataframe_2.filter(page => page.type === 'collection').length;
        const linked_database_count = dataframe_2.filter(page => page.type === 'linked_database').length;
        const template_count = dataframe_2.filter(page => page.is_template).length;
        
        // Calculate duplicate and bottleneck metrics
        const titleCounts = {};
        dataframe_2.forEach(page => {
            titleCounts[page.title] = (titleCounts[page.title] || 0) + 1;
        });
        
        const duplicate_count = Object.values(titleCounts).filter(count => count > 1).length;
        const bottleneck_count = dataframe_2.filter(page => 
            (page.child_ids?.length || 0) > this.BOTTLENECK_THRESHOLD
        ).length;
        
        // Calculate navigation metrics
        const percentage_unlinked = (orphaned_blocks / total_pages) * 100;
        const scatter_index = root_pages / total_pages;
        const unfindable_pages = depths.filter(d => d > this.UNFINDABLE_DEPTH).length;
        
        const nav_depth_score = Math.max(0, 100 - (avg_depth * 10));
        const nav_complexity = (bottleneck_count * 5 + unfindable_pages * 3) / total_pages * 100;

        console.log('Structure metrics calculated:', {
            total_pages,
            max_depth,
            avg_depth,
            deep_pages_count,
            root_pages,
            collections_count
        });

        return {
            total_pages,
            max_depth,
            avg_depth,
            deep_pages_count,
            root_pages,
            orphaned_blocks,
            collections_count,
            linked_database_count,
            template_count,
            duplicate_count,
            bottleneck_count,
            percentage_unlinked,
            scatter_index,
            unfindable_pages,
            nav_depth_score,
            nav_complexity
        };
    }

    calculateUsageMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_3) {
            console.warn('No usage data available');
            return {};
        }

        const total_num_members = dataframe_3.total_members || 0;
        const total_num_guests = dataframe_3.total_guests || 0;
        const total_num_teamspaces = dataframe_3.total_teamspaces || 0;
        const total_num_integrations = dataframe_3.total_integrations || 0;
        const total_num_bots = dataframe_3.total_bots || 0;

        const average_teamspace_members = total_num_teamspaces ? 
            total_num_members / total_num_teamspaces : 0;
        
        const automation_usage_rate = total_num_bots ? 
            (total_num_bots / total_num_members) * 100 : 0;
        
        const current_integration_coverage = 
            (total_num_integrations / this.RECOMMENDED_INTEGRATIONS) * 100;
        
        const automation_efficiency_gain = 
            (automation_usage_rate * 0.1) + (current_integration_coverage * 0.15);

        console.log('Usage metrics calculated:', {
            total_num_members,
            total_num_guests,
            total_num_teamspaces,
            automation_usage_rate
        });

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

    calculateGrowthMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_3) {
            console.warn('No growth data available');
            return {};
        }

        const monthly_member_growth_rate = 
            ((dataframe_3.current_month_members - dataframe_3.previous_month_members) / 
             dataframe_3.previous_month_members) * 100;

        const monthly_content_growth_rate = 
            ((dataframe_3.current_month_blocks - dataframe_3.previous_month_blocks) / 
             dataframe_3.previous_month_blocks) * 100;

        const growth_capacity = 
            (monthly_member_growth_rate * 0.6) + (monthly_content_growth_rate * 0.4);

        const expected_members_in_next_year = 
            dataframe_3.current_month_members * Math.pow(1 + (monthly_member_growth_rate/100), 12);

        console.log('Growth metrics calculated:', {
            monthly_member_growth_rate,
            monthly_content_growth_rate,
            growth_capacity
        });

        return {
            monthly_member_growth_rate,
            monthly_content_growth_rate,
            growth_capacity,
            expected_members_in_next_year
        };
    }

    calculateOrganizationMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_2?.length || !dataframe_3) {
            console.warn('No organization data available');
            return {};
        }

        const structureMetrics = this.calculateStructureMetrics(dataframe_2);
        
        // Calculate visibility score based on page organization
        const current_visibility_score = Math.max(0, 100 - (
            (structureMetrics.percentage_unlinked * 0.3) +
            (structureMetrics.nav_complexity * 0.4) +
            ((100 - structureMetrics.nav_depth_score) * 0.3)
        ));

        // Calculate collaboration score based on teamspace and integration usage
        const current_collaboration_score = 
            (dataframe_3.total_teamspaces / dataframe_3.total_members * 50) +
            (dataframe_3.total_integrations / this.RECOMMENDED_INTEGRATIONS * 50);

        // Calculate productivity score based on automation and template usage
        const current_productivity_score =
            (structureMetrics.template_count / structureMetrics.total_pages * 40) +
            (dataframe_3.total_bots / dataframe_3.total_members * 60);

        // Calculate overall organization score
        const current_organization_score = 
            (current_visibility_score * 0.4) +
            (current_collaboration_score * 0.3) +
            (current_productivity_score * 0.3);

        // Project future organization score based on growth
        const projected_organisation_score = 
            current_organization_score * (1 + (this.calculateGrowthMetrics(dataframe_2, dataframe_3).growth_capacity / 100));

        const success_improvement = projected_organisation_score - current_organization_score;

        console.log('Organization metrics calculated:', {
            current_visibility_score,
            current_collaboration_score,
            current_productivity_score,
            current_organization_score
        });

        return {
            current_visibility_score,
            current_collaboration_score,
            current_productivity_score,
            current_organization_score,
            projected_organisation_score,
            success_improvement
        };
    }

    calculateROIMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_3) {
            console.warn('No ROI data available');
            return {};
        }

        const current_plan = this.calculatePlanCost(dataframe_3.total_members, 'team');
        const enterprise_plan = this.calculatePlanCost(dataframe_3.total_members, 'enterprise');
        const enterprise_plan_w_ai = this.calculatePlanCost(dataframe_3.total_members, 'enterprise_ai');

        const productivity_gain_10 = this.calculateProductivityGain(dataframe_3.total_members, 0.1);
        const productivity_gain_20 = this.calculateProductivityGain(dataframe_3.total_members, 0.2);
        const productivity_gain_50 = this.calculateProductivityGain(dataframe_3.total_members, 0.5);

        const enterprise_plan_roi = 
            (productivity_gain_20 - (enterprise_plan - current_plan)) / (enterprise_plan - current_plan) * 100;
        
        const enterprise_plan_w_ai_roi = 
            (productivity_gain_50 - (enterprise_plan_w_ai - current_plan)) / (enterprise_plan_w_ai - current_plan) * 100;

        console.log('ROI metrics calculated:', {
            current_plan,
            enterprise_plan,
            enterprise_plan_w_ai,
            enterprise_plan_roi,
            enterprise_plan_w_ai_roi
        });

        return {
            current_plan,
            enterprise_plan,
            enterprise_plan_w_ai,
            '10_percent_increase': productivity_gain_10,
            '20_percent_increase': productivity_gain_20,
            '50_percent_increase': productivity_gain_50,
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
} 