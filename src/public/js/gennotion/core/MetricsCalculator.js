export class MetricsCalculator {
    constructor() {
        // Constants for calculations
        this.INDUSTRY_AVERAGE_TEAM_SIZE = 8;
        this.RECOMMENDED_INTEGRATIONS = 5;
        this.DEEP_PAGE_THRESHOLD = 5;
        this.BOTTLENECK_THRESHOLD = 10;
        this.SCATTER_THRESHOLD = 0.3;
        this.UNFINDABLE_DEPTH = 4;
        this.STALE_CONTENT_DAYS = 90;
        this.INDUSTRY_BENCHMARK_TEAM_SIZE = 12;
        this.AI_MULTIPLIER = 1.4;
        this.EFFICIENCY_MULTIPLIER = 1.5;
    }

    calculateAllMetrics(dataframe_2, dataframe_3) {
        // Debug log the full structure
        console.log('Data received:', {
            dataframe_2: {
                length: dataframe_2?.length,
                sample: dataframe_2?.[0],
                keys: dataframe_2?.[0] ? Object.keys(dataframe_2[0]) : []
            },
            dataframe_3: {
                keys: dataframe_3 ? Object.keys(dataframe_3) : [],
                values: dataframe_3
            }
        });

        const structureMetrics = this.calculateStructureMetrics(dataframe_2);
        const usageMetrics = this.calculateUsageMetrics(dataframe_2, dataframe_3);
        const growthMetrics = this.calculateGrowthMetrics(dataframe_2, dataframe_3);
        const organizationMetrics = this.calculateOrganizationMetrics(dataframe_2, dataframe_3);
        const roiMetrics = this.calculateROIMetrics(dataframe_2, dataframe_3);
        const teamMetrics = this.calculateTeamMetrics(dataframe_2, dataframe_3);
        const securityMetrics = this.calculateSecurityMetrics(dataframe_2, dataframe_3);

        const baseMetrics = {
            ...structureMetrics,
            ...usageMetrics,
            ...growthMetrics,
            ...organizationMetrics,
            ...roiMetrics,
            ...teamMetrics,
            ...securityMetrics
        };

        // Calculate derived metrics
        const derivedMetrics = {
            ...baseMetrics,
            search_success_rate: 95, // Placeholder - requires search analytics
            avg_nav_depth: baseMetrics.avg_depth,
            duplicate_content_rate: (baseMetrics.duplicate_count / baseMetrics.total_pages) * 100,
            search_time_reduction: 40, // Projected improvement
            current_support_time: 24, // Standard support time in hours
            available_training: 'Basic documentation', // Current training resources
            admin_feature_usage: 60, // Current admin feature utilization percentage
            
            // Additional derived metrics
            content_per_user: baseMetrics.total_blocks / baseMetrics.total_num_members,
            automation_coverage: (baseMetrics.total_num_bots / baseMetrics.total_num_members) * 100,
            integration_diversity: (
                (baseMetrics.total_num_link_preview_integrations + baseMetrics.total_num_public_integrations) /
                baseMetrics.total_num_integrations
            ) * 100,
            permission_coverage: (
                baseMetrics.total_num_permission_groups / baseMetrics.total_num_members
            ) * 100
        };

        return derivedMetrics;
    }

    calculateStructureMetrics(dataframe_2) {
        if (!dataframe_2?.length) {
            console.warn('No data available for structure metrics');
            return {};
        }

        // Log sample of data being processed
        console.log('Processing structure metrics for:', {
            sampleNode: dataframe_2[0],
            typeField: dataframe_2[0]?.type || dataframe_2[0]?.TYPE,
            parentField: dataframe_2[0]?.parent_id || dataframe_2[0]?.PARENT_ID,
            childField: dataframe_2[0]?.child_ids || dataframe_2[0]?.CHILD_IDS
        });

        const depths = this.calculateDepths(dataframe_2);
        const total_pages = dataframe_2.length;
        const max_depth = Math.max(...depths);
        const avg_depth = depths.reduce((a, b) => a + b, 0) / depths.length;
        const deep_pages_count = depths.filter(d => d > this.DEEP_PAGE_THRESHOLD).length;
        
        // Adjust field names based on actual data structure
        const root_pages = dataframe_2.filter(page => 
            !(page.parent_id || page.PARENT_ID)
        ).length;
        
        const orphaned_blocks = dataframe_2.filter(page => 
            !(page.parent_id || page.PARENT_ID) && 
            !(page.child_ids?.length || page.CHILD_IDS?.length)
        ).length;
        
        const collections_count = dataframe_2.filter(page => 
            (page.type || page.TYPE)?.toLowerCase()?.includes('collection')
        ).length;
        
        const linked_database_count = dataframe_2.filter(page => 
            (page.type || page.TYPE)?.toLowerCase()?.includes('linked_database')
        ).length;
        
        const template_count = dataframe_2.filter(page => 
            page.is_template || page.IS_TEMPLATE
        ).length;

        // Calculate duplicate and bottleneck metrics
        const titleCounts = {};
        dataframe_2.forEach(page => {
            const title = page.title || page.TITLE || page.text || page.TEXT;
            titleCounts[title] = (titleCounts[title] || 0) + 1;
        });
        
        const duplicate_count = Object.values(titleCounts).filter(count => count > 1).length;
        const bottleneck_count = dataframe_2.filter(page => {
            const childCount = (page.child_ids?.length || page.CHILD_IDS?.length || 0);
            return childCount > this.BOTTLENECK_THRESHOLD;
        }).length;
        
        // Calculate navigation metrics
        const percentage_unlinked = (orphaned_blocks / total_pages) * 100;
        const scatter_index = root_pages / total_pages;
        const unfindable_pages = depths.filter(d => d > this.UNFINDABLE_DEPTH).length;
        
        const nav_depth_score = Math.max(0, 100 - (avg_depth * 10));
        const nav_complexity = (bottleneck_count * 5 + unfindable_pages * 3) / total_pages * 100;

        // Additional metrics needed
        const total_blocks = dataframe_2.reduce((sum, page) => 
            sum + (page.block_count || page.BLOCK_COUNT || 1), 0);
        
        const alive_blocks = dataframe_2.filter(page => {
            const lastEdited = page.last_edited || page.LAST_EDITED;
            return !lastEdited || (Date.now() - new Date(lastEdited)) < (this.STALE_CONTENT_DAYS * 24 * 60 * 60 * 1000);
        }).length;

        const alive_collections = dataframe_2.filter(page => 
            (page.type || page.TYPE)?.toLowerCase()?.includes('collection') &&
            (!page.last_edited || (Date.now() - new Date(page.last_edited)) < (this.STALE_CONTENT_DAYS * 24 * 60 * 60 * 1000))
        ).length;

        const private_pages = dataframe_2.filter(page => 
            !(page.public || page.PUBLIC)
        ).length;

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
            nav_complexity,
            total_blocks,
            alive_blocks,
            alive_collections,
            private_pages,
            alive_blocks_ratio: alive_blocks / total_blocks,
            alive_collections_ratio: alive_collections / collections_count,
            alive_pages_ratio: alive_blocks / total_pages,
            private_pages_ratio: private_pages / total_pages
        };
    }

    calculateUsageMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_3) {
            console.warn('No usage data available');
            return {};
        }

        // Log the usage data structure
        console.log('Processing usage metrics with:', dataframe_3);

        // Handle both camelCase and snake_case field names
        const total_num_members = dataframe_3.total_members || dataframe_3.totalMembers || 0;
        const total_num_guests = dataframe_3.total_guests || dataframe_3.totalGuests || 0;
        const total_num_teamspaces = dataframe_3.total_teamspaces || dataframe_3.totalTeamspaces || 0;
        const total_num_integrations = dataframe_3.total_integrations || dataframe_3.totalIntegrations || 0;
        const total_num_bots = dataframe_3.total_bots || dataframe_3.totalBots || 0;

        const average_teamspace_members = total_num_teamspaces ? 
            total_num_members / total_num_teamspaces : 0;
        
        const automation_usage_rate = total_num_members ? 
            (total_num_bots / total_num_members) * 100 : 0;
        
        const current_integration_coverage = 
            (total_num_integrations / this.RECOMMENDED_INTEGRATIONS) * 100;
        
        const automation_efficiency_gain = 
            (automation_usage_rate * 0.1) + (current_integration_coverage * 0.15);

        // Additional metrics needed
        const total_num_blocks = dataframe_3.total_blocks || dataframe_3.totalBlocks || 0;
        const total_num_permission_groups = dataframe_3.total_permission_groups || dataframe_3.totalPermissionGroups || 0;
        const total_num_internal_bots = dataframe_3.total_internal_bots || dataframe_3.totalInternalBots || 0;
        const total_num_public_bots = dataframe_3.total_public_bots || dataframe_3.totalPublicBots || 0;
        const total_num_link_preview_integrations = dataframe_3.total_link_preview_integrations || dataframe_3.totalLinkPreviewIntegrations || 0;
        const total_num_public_integrations = dataframe_3.total_public_integrations || dataframe_3.totalPublicIntegrations || 0;

        return {
            total_num_members,
            total_num_guests,
            total_num_teamspaces,
            total_num_integrations,
            total_num_bots,
            average_teamspace_members,
            automation_usage_rate,
            current_integration_coverage,
            automation_efficiency_gain,
            total_num_blocks,
            total_num_permission_groups,
            total_num_internal_bots,
            total_num_public_bots,
            total_num_link_preview_integrations,
            total_num_public_integrations
        };
    }

    calculateGrowthMetrics(dataframe_2, dataframe_3) {
        if (!dataframe_3) {
            console.warn('No growth data available');
            return {};
        }

        // Log the growth data structure
        console.log('Processing growth metrics with:', {
            current_month_members: dataframe_3.current_month_members || dataframe_3.currentMonthMembers,
            previous_month_members: dataframe_3.previous_month_members || dataframe_3.previousMonthMembers,
            current_month_blocks: dataframe_3.current_month_blocks || dataframe_3.currentMonthBlocks,
            previous_month_blocks: dataframe_3.previous_month_blocks || dataframe_3.previousMonthBlocks
        });

        // Handle both camelCase and snake_case field names
        const current_month_members = dataframe_3.current_month_members || dataframe_3.currentMonthMembers || 0;
        const previous_month_members = dataframe_3.previous_month_members || dataframe_3.previousMonthMembers || 1; // Avoid division by zero
        const current_month_blocks = dataframe_3.current_month_blocks || dataframe_3.currentMonthBlocks || 0;
        const previous_month_blocks = dataframe_3.previous_month_blocks || dataframe_3.previousMonthBlocks || 1; // Avoid division by zero

        const monthly_member_growth_rate = 
            ((current_month_members - previous_month_members) / previous_month_members) * 100;

        const monthly_content_growth_rate = 
            ((current_month_blocks - previous_month_blocks) / previous_month_blocks) * 100;

        const growth_capacity = 
            (monthly_member_growth_rate * 0.6) + (monthly_content_growth_rate * 0.4);

        const expected_members_in_next_year = 
            current_month_members * Math.pow(1 + (monthly_member_growth_rate/100), 12);

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

    calculateTeamMetrics(dataframe_2, dataframe_3) {
        const average_teamspace_members = dataframe_3.total_members / dataframe_3.total_teamspaces;
        const underutilised_teamspaces = Math.floor(
            dataframe_3.total_teamspaces * 
            (dataframe_3.teamspaces_below_average / 100 || 0.3)
        );
        
        const potential_teamspace_growth = Math.ceil(
            (this.INDUSTRY_BENCHMARK_TEAM_SIZE - average_teamspace_members) * 
            dataframe_3.total_teamspaces
        );

        const current_collaboration_score = 
            ((dataframe_3.active_members / dataframe_3.total_members) * 0.5 +
            (dataframe_3.teamspaces_with_guests / dataframe_3.total_teamspaces) * 0.5) * 100;

        return {
            average_teamspace_members,
            underutilised_teamspaces,
            potential_teamspace_growth,
            current_collaboration_score,
            teamspace_optimisation_potential: (underutilised_teamspaces / dataframe_3.total_teamspaces) * 100
        };
    }

    calculateSecurityMetrics(dataframe_2, dataframe_3) {
        const public_pages = dataframe_2.filter(page => page.public || page.PUBLIC).length;
        const sensitive_content = dataframe_2.filter(page => 
            (page.title || page.TITLE || '').toLowerCase().includes('confidential') ||
            (page.title || page.TITLE || '').toLowerCase().includes('sensitive')
        ).length;

        const security_improvement_score = 
            ((1 - (public_pages / dataframe_2.length)) * 0.4 +
            (dataframe_3.total_permission_groups / dataframe_3.total_members) * 0.6) * 100;

        return {
            public_pages_count: public_pages,
            sensitive_content_count: sensitive_content,
            security_improvement_score
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

    generateMarkdownPlaceholderMap(dataframe_2, dataframe_3) {
        const metrics = this.calculateAllMetrics(dataframe_2, dataframe_3);
        
        // Format all numerical values
        const formattedMetrics = {};
        for (const [key, value] of Object.entries(metrics)) {
            if (typeof value === 'number') {
                if (key.includes('cost') || key.includes('plan') || key.includes('increase')) {
                    formattedMetrics[key] = this.formatCurrency(value);
                } else if (key.includes('rate') || key.includes('percentage') || key.includes('score')) {
                    formattedMetrics[key] = `${value.toFixed(1)}%`;
                } else {
                    formattedMetrics[key] = value.toFixed(1);
                }
            } else {
                formattedMetrics[key] = value;
            }
        }

        return {
            ...formattedMetrics,
            current_implementation_summary: this.generateCurrentImplementationSummary(metrics),
            potential_enterprise_implementation_summary: this.generateEnterpriseImplementationSummary(metrics),
            potential_enterprise_w_ai_implementation_summary: this.generateEnterpriseAIImplementationSummary(metrics)
        };
    }

    // Helper methods for generating summaries
    generateCurrentImplementationSummary(metrics) {
        return `Current workspace has ${metrics.total_num_members} members across ${metrics.total_num_teamspaces} teamspaces, ` +
               `managing ${metrics.total_pages} pages with ${metrics.total_num_integrations} integrations. ` +
               `The workspace shows a ${metrics.monthly_content_growth_rate.toFixed(1)}% monthly growth rate with ` +
               `${metrics.automation_usage_rate.toFixed(1)}% automation adoption.`;
    }

    generateEnterpriseImplementationSummary(metrics) {
        return `Enterprise implementation projects ${metrics.projected_organisation_score.toFixed(1)}% organization score ` +
               `(up from ${metrics.current_organization_score.toFixed(1)}%), with enhanced security controls, ` +
               `centralized permissions, and structured growth management. Expected ROI of ${metrics.enterprise_plan_roi.toFixed(1)}% ` +
               `based on current usage patterns.`;
    }

    generateEnterpriseAIImplementationSummary(metrics) {
        const aiMultiplier = 1.4; // 40% additional improvement with AI
        return `Enterprise + AI implementation projects ${(metrics.projected_organisation_score * aiMultiplier).toFixed(1)}% organization score, ` +
               `leveraging AI for automation and insights. Estimated productivity gain of ` +
               `${(metrics.automation_efficiency_gain * aiMultiplier).toFixed(1)}% with AI-powered features and workflows. ` +
               `Expected ROI of ${(metrics.enterprise_plan_roi * aiMultiplier).toFixed(1)}%.`;
    }

    formatGrowthTrend(history) {
        if (!Array.isArray(history) || history.length === 0) {
            return 'Steady growth';
        }
        const average = history.reduce((a, b) => a + b, 0) / history.length;
        if (average > 20) return 'Rapid growth';
        if (average > 10) return 'Strong growth';
        if (average > 5) return 'Moderate growth';
        if (average > 0) return 'Steady growth';
        return 'Stable';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
} 