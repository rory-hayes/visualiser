// reportGenerator.js

export function calculateMetrics(dataframe_2, dataframe_3) {
    const metrics = {};
    
    try {
        if (!dataframe_2 || !dataframe_3) {
            throw new Error('Missing required dataframes');
        }

        // Detailed logging of input data
        console.log('Detailed Input Data:', {
            dataframe_2: {
                length: dataframe_2.length,
                sample: dataframe_2[0],
                fields: dataframe_2[0] ? Object.keys(dataframe_2[0]) : [],
                hasParentField: dataframe_2[0]?.parent !== undefined,
                hasTypeField: dataframe_2[0]?.type !== undefined,
                hasTitleField: dataframe_2[0]?.title !== undefined
            },
            dataframe_3: {
                fields: Object.keys(dataframe_3),
                num_blocks: dataframe_3.num_blocks,
                num_total_pages: dataframe_3.num_total_pages,
                total_num_members: dataframe_3.total_num_members,
                total_num_teamspaces: dataframe_3.total_num_teamspaces,
                current_month_blocks: dataframe_3.current_month_blocks,
                previous_month_blocks: dataframe_3.previous_month_blocks
            }
        });

        // Direct SQL metrics with logging
        const sqlMetrics = calculateSQLMetrics(dataframe_3);
        console.log('SQL Metrics:', sqlMetrics);
        Object.assign(metrics, sqlMetrics);

        // Graph structure metrics with logging
        const graphMetrics = calculateGraphMetrics(dataframe_2);
        console.log('Graph Metrics:', graphMetrics);
        Object.assign(metrics, graphMetrics);

        // Growth metrics with logging
        const growthMetrics = calculateGrowthMetrics(dataframe_3);
        console.log('Growth Metrics:', growthMetrics);
        Object.assign(metrics, growthMetrics);

        // Usage metrics with logging
        const usageMetrics = calculateUsageMetrics(dataframe_3);
        console.log('Usage Metrics:', usageMetrics);
        Object.assign(metrics, usageMetrics);

        // Key insights with logging
        const keyInsights = calculateKeyInsights(dataframe_3);
        console.log('Key Insights:', keyInsights);
        Object.assign(metrics, keyInsights);

        // Combined and calculated metrics with logging
        const combinedMetrics = calculateCombinedMetrics(metrics);
        console.log('Combined Metrics:', combinedMetrics);
        Object.assign(metrics, combinedMetrics);

        // ROI calculations with logging
        const roiMetrics = calculateROIMetrics(dataframe_3, metrics);
        console.log('ROI Metrics:', roiMetrics);
        Object.assign(metrics, roiMetrics);

        // Mark unavailable metrics
        markUnavailableMetrics(metrics);

        // Log final metrics
        console.log('Final Metrics:', metrics);

        return metrics;

    } catch (error) {
        console.error('Error in calculateMetrics:', error);
        console.error('Error details:', {
            hasDataframe2: !!dataframe_2,
            hasDataframe3: !!dataframe_3,
            dataframe2Length: dataframe_2?.length,
            dataframe3Fields: dataframe_3 ? Object.keys(dataframe_3) : []
        });
        throw error;
    }
}

function calculateSQLMetrics(data) {
    try {
        // Validate required fields
        const requiredFields = [
            'num_total_pages',
            'num_pages',
            'num_collections',
            'total_num_collection_views',
            'num_public_pages',
            'total_num_integrations',
            'total_num_members',
            'total_num_guests',
            'total_num_teamspaces',
            'num_alive_pages',
            'num_private_pages',
            'num_alive_blocks',
            'num_blocks',
            'num_alive_collections',
            'total_arr',
            'total_paid_seats'
        ];

        const missingFields = requiredFields.filter(field => data[field] === undefined);
        if (missingFields.length > 0) {
            console.warn('Missing required fields in SQL data:', missingFields);
        }

        // Log input data for debugging
        console.log('SQL Metrics Input:', {
            pages: {
                total: data.num_total_pages,
                alive: data.num_alive_pages,
                public: data.num_public_pages,
                private: data.num_private_pages
            },
            blocks: {
                total: data.num_blocks,
                alive: data.num_alive_blocks
            },
            collections: {
                total: data.num_collections,
                alive: data.num_alive_collections,
                views: data.total_num_collection_views
            },
            users: {
                members: data.total_num_members,
                guests: data.total_num_guests,
                teamspaces: data.total_num_teamspaces
            }
        });

        const metrics = {
            // Page metrics
            total_pages: data.num_total_pages || 0,
            page_count: data.num_pages || 0,
            collections_count: data.num_collections || 0,
            collection_views: data.total_num_collection_views || 0,
            public_pages_count: data.num_public_pages || 0,
            num_alive_pages: data.num_alive_pages || 0,
            num_private_pages: data.num_private_pages || 0,

            // Block metrics
            num_alive_blocks: data.num_alive_blocks || 0,
            num_blocks: data.num_blocks || 0,
            num_alive_collections: data.num_alive_collections || 0,

            // User metrics
            total_num_members: data.total_num_members || 0,
            total_num_guests: data.total_num_guests || 0,
            total_num_teamspaces: data.total_num_teamspaces || 0,

            // Integration metrics
            connected_tool_count: data.total_num_integrations || 0,
            total_num_bots: data.total_num_bots || 0,
            total_num_internal_bots: data.total_num_internal_bots || 0,
            total_num_public_bots: data.total_num_public_bots || 0,
            total_num_link_preview_integrations: data.total_num_link_preview_integrations || 0,
            total_num_public_integrations: data.total_num_public_integrations || 0,

            // Historical metrics
            current_month_blocks: data.current_month_blocks || 0,
            previous_month_blocks: data.previous_month_blocks || 0,
            current_year_blocks: data.current_year_blocks || 0,
            previous_year_blocks: data.previous_year_blocks || 0,
            current_month_pages: data.current_month_pages || 0,
            previous_month_pages: data.previous_month_pages || 0,
            current_month_members: data.current_month_members || 0,
            previous_month_members: data.previous_month_members || 0,

            // Collaboration metrics
            collaborative_pages: data.collaborative_pages || 0,
            num_permission_groups: data.num_permission_groups || 0,

            // Business metrics
            total_arr: data.total_arr || 0,
            total_paid_seats: data.total_paid_seats || 0
        };

        // Log calculated metrics for debugging
        console.log('Calculated SQL Metrics:', metrics);

        return metrics;
    } catch (error) {
        console.error('Error in calculateSQLMetrics:', error);
        return {};
    }
}

function calculateGraphMetrics(graph) {
    const metrics = {};
    
    try {
        // Basic graph metrics
        metrics.max_depth = Math.max(...graph.map(node => getNodeDepth(node, graph)));
        metrics.avg_depth = calculateAverageDepth(graph);
        metrics.root_pages = graph.filter(node => !node.parent).length;
        metrics.orphaned_blocks = graph.filter(node => !node.parent && !isRootNode(node)).length;
        metrics.deep_pages_count = graph.filter(node => getNodeDepth(node, graph) > 5).length;
        metrics.template_count = graph.filter(node => node.type === 'template').length;
        metrics.linked_database_count = graph.filter(node => node.type === 'collection' && node.parent).length;
        metrics.duplicate_count = findDuplicateTitles(graph).length;
        metrics.bottleneck_count = graph.filter(node => getChildCount(node, graph) > 20).length;
        metrics.unfindable_pages = metrics.orphaned_blocks + metrics.deep_pages_count;

        // Additional graph metrics
        metrics.avg_nav_depth = metrics.avg_depth;
        metrics.scatter_index = (metrics.orphaned_blocks / graph.length) * 100;
        metrics.nav_depth_score = (metrics.avg_depth * 0.4) + (metrics.max_depth * 0.6);
        metrics.duplicate_content_rate = (metrics.duplicate_count / graph.length) * 100;

        return metrics;
    } catch (error) {
        console.error('Error in calculateGraphMetrics:', error);
        return metrics;
    }
}

function calculateGrowthMetrics(data) {
    try {
        const metrics = {
            growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
            blocks_created_last_month: (data.current_month_blocks - data.previous_month_blocks) || 0,
            blocks_created_last_year: (data.current_year_blocks - data.previous_year_blocks) || 0,
            pages_created_last_month: (data.current_month_pages - data.previous_month_pages) || 0,
            monthly_member_growth_rate: calculateGrowthRate(data.current_month_members, data.previous_month_members),
            expected_members_in_next_year: calculateProjectedGrowth(data.total_num_members, data.monthly_member_growth_rate),
            monthly_content_growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
        };

        // Additional growth metrics
        metrics.growth_capacity = data.system_limit ? (1 - (data.num_blocks / data.system_limit)) * 100 : null;
        metrics.potential_teamspace_growth = data.industry_benchmark_team_size ? 
            (data.industry_benchmark_team_size - (data.total_num_members / data.total_num_teamspaces)) * data.total_num_teamspaces : null;

        return metrics;
    } catch (error) {
        console.error('Error in calculateGrowthMetrics:', error);
        return {};
    }
}

function calculateUsageMetrics(data) {
    try {
        const metrics = {
            active_users: data.active_users || 0,
            daily_active_users: data.daily_active_users || 0,
            weekly_active_users: data.weekly_active_users || 0,
            monthly_active_users: data.monthly_active_users || 0,
            average_daily_edits: data.average_daily_edits || 0,
            average_weekly_edits: data.average_weekly_edits || 0,
            pages_per_user: (data.num_pages / data.total_num_members) || 0,
            edits_per_user: (data.total_edits / data.total_num_members) || 0,
            collaboration_rate: ((data.collaborative_pages / data.num_total_pages) * 100) || 0,
            engagement_score: calculateEngagementScore(data)
        };

        // Additional usage metrics
        metrics.average_teamspace_members = (data.total_num_members / data.total_num_teamspaces) || 0;
        metrics.teamspaces_with_guests = data.total_num_guests || 0;
        metrics.automation_usage_rate = (data.total_num_bots / data.total_num_members) * 100;
        metrics.current_integration_coverage = (data.total_num_integrations / data.total_num_members) * 100;
        metrics.underutilised_teamspaces = data.teamspaces_below_average || 0;

        return metrics;
    } catch (error) {
        console.error('Error in calculateUsageMetrics:', error);
        return {};
    }
}

function calculateEngagementScore(data) {
    const dailyWeight = 0.4;
    const weeklyWeight = 0.3;
    const monthlyWeight = 0.2;
    const editWeight = 0.1;

    const dailyScore = (data.daily_active_users / data.total_num_members) || 0;
    const weeklyScore = (data.weekly_active_users / data.total_num_members) || 0;
    const monthlyScore = (data.monthly_active_users / data.total_num_members) || 0;
    const editScore = (data.average_daily_edits / data.total_num_members) || 0;

    return (dailyScore * dailyWeight + 
            weeklyScore * weeklyWeight + 
            monthlyScore * monthlyWeight + 
            editScore * editWeight) * 100;
}

function calculateKeyInsights(data) {
    try {
        // Log input data for debugging
        console.log('Calculating Key Insights from:', {
            blocks: {
                current: data.current_month_blocks,
                previous: data.previous_month_blocks
            },
            members: {
                current: data.current_month_members,
                previous: data.previous_month_members,
                total: data.total_num_members
            },
            pages: {
                total: data.num_total_pages,
                alive: data.num_alive_pages,
                private: data.num_private_pages
            },
            collections: {
                total: data.num_collections,
                alive: data.num_alive_collections,
                views: data.total_num_collection_views
            }
        });

        const insights = {
            // Monthly block growth rate
            key_metrics_insight_1: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
            
            // User growth rate
            key_metrics_insight_2: calculateGrowthRate(data.current_month_members, data.previous_month_members),
            
            // Content per user
            key_metrics_insight_3: data.num_alive_blocks / data.total_num_members || 0,
            
            // Total user base
            key_metrics_insight_4: (data.total_num_members + data.total_num_guests) || 0,
            
            // Team density
            key_metrics_insight_5: data.total_num_members / data.total_num_teamspaces || 0,
            
            // Pages per user
            key_metrics_insight_6: data.num_alive_pages / data.total_num_members || 0,
            
            // Content health
            key_metrics_insight_7: (data.num_alive_blocks / data.num_blocks * 100) || 0,
            
            // Database health
            key_metrics_insight_8: (data.num_alive_collections / data.num_collections * 100) || 0,
            
            // Team content density
            key_metrics_insight_9: data.num_blocks / data.total_num_teamspaces || 0,
            
            // Integration adoption
            key_metrics_insight_10: data.total_num_integrations || 0,
            
            // Automation adoption
            key_metrics_insight_11: calculateTotalBots(data),
            
            // Integration diversity
            key_metrics_insight_12: calculateTotalIntegrations(data),
            
            // Page utilization
            key_metrics_insight_13: (data.num_alive_pages / data.num_total_pages * 100) || 0,
            
            // Privacy ratio
            key_metrics_insight_14: (data.num_private_pages / data.num_total_pages * 100) || 0,
            
            // Database usage
            key_metrics_insight_15: (data.total_num_collection_views / data.num_total_pages * 100) || 0,
            
            // Block utilization
            key_metrics_insight_16: (data.num_alive_blocks / data.num_blocks * 100) || 0,
            
            // Content per user
            key_metrics_insight_17: data.num_alive_blocks / data.total_num_members || 0,
            
            // Content growth rate
            key_metrics_insight_18: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
        };

        // Log calculated insights for debugging
        console.log('Calculated Key Insights:', insights);

        return insights;
    } catch (error) {
        console.error('Error in calculateKeyInsights:', error);
        return {};
    }
}

function calculateCombinedMetrics(metrics) {
    try {
        return {
            nav_complexity: calculateNavComplexity(metrics),
            duplicate_content_rate: (metrics.duplicate_count / metrics.total_pages * 100) || 0,
            percentage_unlinked: (metrics.orphaned_blocks / metrics.total_pages * 100) || 0,
            current_collaboration_score: calculateCollaborationScore(metrics),
            current_visibility_score: calculateVisibilityScore(metrics),
            projected_visibility_score: calculateVisibilityScore(metrics) * 1.3,
            current_productivity_score: calculateProductivityScore(metrics),
            ai_productivity_gain: calculateProductivityScore(metrics) * 1.4,
            automation_potential: calculateAutomationPotential(metrics),
            projected_time_savings: calculateProjectedTimeSavings(metrics),
            current_organization_score: calculateOrganizationScore(metrics),
            projected_organisation_score: calculateOrganizationScore(metrics) * 1.3,
            security_improvement_score: calculateSecurityScore(metrics),
            success_improvement: calculateSuccessImprovement(metrics),
            teamspace_optimisation_potential: (metrics.underutilised_teamspaces / metrics.total_num_teamspaces * 100) || 0,
            automation_efficiency_gain: metrics.automation_usage_rate ? metrics.automation_usage_rate * 1.5 : 0
        };
    } catch (error) {
        console.error('Error in calculateCombinedMetrics:', error);
        return {};
    }
}

function calculateROIMetrics(data, metrics) {
    try {
        const enterpriseCost = 20;
        const enterpriseAICost = 25;
        const implementationCost = 5000;
        const current = data.total_arr / data.total_paid_seats;
        const enterprise = enterpriseCost * data.total_paid_seats;
        const enterpriseAI = enterpriseAICost * data.total_paid_seats;

        return {
            current_plan: current,
            enterprise_plan: enterprise,
            enterprise_plan_w_ai: enterpriseAI,
            '10_percent_increase': calculateIncrease(0.1, data.total_paid_seats, enterprise, current),
            '20_percent_increase': calculateIncrease(0.2, data.total_paid_seats, enterprise, current),
            '50_percent_increase': calculateIncrease(0.5, data.total_paid_seats, enterprise, current),
            '10_percent_increase_w_ai': calculateIncrease(0.1, data.total_paid_seats, enterpriseAI, current),
            '20_percent_increase_w_ai': calculateIncrease(0.2, data.total_paid_seats, enterpriseAI, current),
            '50_percent_increase_w_ai': calculateIncrease(0.5, data.total_paid_seats, enterpriseAI, current),
            enterprise_plan_roi: calculateEnterpriseROI(metrics, current, enterprise, implementationCost),
            enterprise_plan_w_ai_roi: calculateEnterpriseROI(metrics, current, enterpriseAI, implementationCost, true)
        };
    } catch (error) {
        console.error('Error in calculateROIMetrics:', error);
        return {};
    }
}

function calculateEnterpriseROI(metrics, currentCost, newCost, implementationCost, includeAI = false) {
    try {
        const projectedBenefit = metrics.current_productivity_score * (includeAI ? 1.4 : 1.2);
        return ((projectedBenefit - currentCost) / implementationCost) * 100;
    } catch (error) {
        console.error('Error in calculateEnterpriseROI:', error);
        return 0;
    }
}

function calculateVisibilityScore(metrics) {
    try {
        return (metrics.num_public_pages / metrics.num_total_pages * 0.4) +
               (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
    } catch (error) {
        console.error('Error in calculateVisibilityScore:', error);
        return 0;
    }
}

function calculateCollaborationScore(metrics) {
    try {
        return ((metrics.teamspaces_with_guests / metrics.total_num_teamspaces * 0.5) +
                (metrics.average_teamspace_members / 10 * 0.5)) * 100;
    } catch (error) {
        console.error('Error in calculateCollaborationScore:', error);
        return 0;
    }
}

function calculateProductivityScore(metrics) {
    try {
        return (metrics.num_alive_blocks / metrics.total_num_members) / 100;
    } catch (error) {
        console.error('Error in calculateProductivityScore:', error);
        return 0;
    }
}

function calculateSecurityScore(metrics) {
    try {
        return (metrics.num_private_pages / metrics.num_total_pages * 0.4) +
               (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
    } catch (error) {
        console.error('Error in calculateSecurityScore:', error);
        return 0;
    }
}

function calculateSuccessImprovement(metrics) {
    return metrics.projected_organisation_score - metrics.current_organization_score;
}

function calculateIncrease(percentage, seats, newPlan, currentPlan) {
    return seats * (1 + percentage) * (newPlan - currentPlan);
}

function calculateAutomationPotential(metrics) {
    return (metrics.total_num_integrations / (metrics.total_num_members * 0.5)) * 100;
}

function calculateProjectedTimeSavings(metrics) {
    const averageManualHours = 2;
    return (metrics.automation_potential / 100) * averageManualHours * metrics.total_num_members;
}

function calculateOrganizationScore(metrics) {
    return (metrics.current_visibility_score * 0.3) +
           (metrics.current_collaboration_score * 0.4) +
           (metrics.current_productivity_score * 0.3);
}

function calculateNavComplexity(metrics) {
    return (metrics.max_depth * 0.3) + 
           (metrics.avg_depth * 0.3) + 
           (metrics.orphaned_blocks / metrics.total_pages * 0.4);
}

function calculateProjectedGrowth(current, monthlyRate) {
    return current * Math.pow(1 + monthlyRate/100, 12);
}

function calculateTotalBots(data) {
    return (data.total_num_bots || 0) + 
           (data.total_num_internal_bots || 0) + 
           (data.total_num_public_bots || 0);
}

function calculateTotalIntegrations(data) {
    return (data.total_num_link_preview_integrations || 0) + 
           (data.total_num_public_integrations || 0);
}

function markUnavailableMetrics(metrics) {
    const unavailable = [
        'daily_active_pages',
        'weekly_edits',
        'stale_content_count',
        'search_deadends',
        'load_time_impact',
        'resource_usage',
        'api_calls_monthly',
        'top_collaborators',
        'current_ai_usage',
        'sensitive_content_count',
        'unusual_access_patterns',
        'search_success_rate',
        'search_time_reduction',
        'current_support_time',
        'available_training',
        'admin_feature_usage'
    ];
    
    unavailable.forEach(metric => {
        metrics[metric] = null;
    });
}

export function generateReport(markdownTemplate, metrics) {
    try {
        let report = markdownTemplate;
        for (const [key, value] of Object.entries(metrics)) {
            const placeholder = `[[${key}]]`;
            const displayValue = value ?? "Not available";
            report = report.replace(new RegExp(placeholder, 'g'), displayValue);
        }
        return report;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

// Helper functions
function getNodeDepth(node, graph, cache = new Map()) {
    if (cache.has(node.id)) return cache.get(node.id);
    if (!node.parent) return 0;
    const parentNode = graph.find(n => n.id === node.parent);
    if (!parentNode) return 0;
    const depth = 1 + getNodeDepth(parentNode, graph, cache);
    cache.set(node.id, depth);
    return depth;
}

function calculateAverageDepth(graph) {
    const depths = graph.map(node => getNodeDepth(node, graph));
    return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
}

function getChildCount(node, graph) {
    return graph.filter(n => n.parent === node.id).length;
}

function isRootNode(node) {
    return node.type === 'page' && !node.parent;
}

function findDuplicateTitles(graph) {
    const titles = {};
    return graph.filter(node => {
        if (!node.title) return false;
        if (titles[node.title]) return true;
        titles[node.title] = true;
        return false;
    });
}

function calculateGrowthRate(current, previous) {
    if (!current || !previous || previous === 0) {
        console.log('Invalid growth rate inputs:', { current, previous });
        return 0;
    }
    return ((current - previous) / previous * 100);
}