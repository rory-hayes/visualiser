// reportGenerator.js

export function calculateMetrics(dataframe_2, dataframe_3) {
    const metrics = {};
    
    try {
        if (!dataframe_2 || !dataframe_3) {
            throw new Error('Missing required dataframes');
        }

        // Direct SQL metrics
        const sqlMetrics = calculateSQLMetrics(dataframe_3);
        Object.assign(metrics, sqlMetrics);

        // Graph structure metrics
        const graphMetrics = calculateGraphMetrics(dataframe_2);
        Object.assign(metrics, graphMetrics);

        // Growth metrics
        const growthMetrics = calculateGrowthMetrics(dataframe_3);
        Object.assign(metrics, growthMetrics);

        // Usage metrics
        const usageMetrics = calculateUsageMetrics(dataframe_3);
        Object.assign(metrics, usageMetrics);

        // Key insights
        const keyInsights = calculateKeyInsights(dataframe_3);
        Object.assign(metrics, keyInsights);

        // Combined and calculated metrics
        const combinedMetrics = calculateCombinedMetrics(metrics);
        Object.assign(metrics, combinedMetrics);

        // ROI calculations
        const roiMetrics = calculateROIMetrics(dataframe_3, metrics);
        Object.assign(metrics, roiMetrics);

        // Mark unavailable metrics
        markUnavailableMetrics(metrics);

        return metrics;

    } catch (error) {
        console.error('Error in calculateMetrics:', error);
        throw error;
    }
}

function calculateSQLMetrics(data) {
    return {
        total_pages: data.num_total_pages || 0,
        page_count: data.num_pages || 0,
        collections_count: data.num_collections || 0,
        collection_views: data.total_num_collection_views || 0,
        public_pages_count: data.num_public_pages || 0,
        connected_tool_count: data.total_num_integrations || 0,
        total_num_members: data.total_num_members || 0,
        total_num_guests: data.total_num_guests || 0,
        total_num_teamspaces: data.total_num_teamspaces || 0,
        num_alive_pages: data.num_alive_pages || 0,
        num_private_pages: data.num_private_pages || 0,
        num_alive_blocks: data.num_alive_blocks || 0,
        num_blocks: data.num_blocks || 0,
        num_alive_collections: data.num_alive_collections || 0,
        total_arr: data.total_arr || 0,
        total_paid_seats: data.total_paid_seats || 0
    };
}

function calculateGraphMetrics(graph) {
    const metrics = {};
    
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

    return metrics;
}

function calculateGrowthMetrics(data) {
    return {
        growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
        blocks_created_last_month: (data.current_month_blocks - data.previous_month_blocks) || 0,
        blocks_created_last_year: (data.current_year_blocks - data.previous_year_blocks) || 0,
        pages_created_last_month: (data.current_month_pages - data.previous_month_pages) || 0,
        monthly_member_growth_rate: calculateGrowthRate(data.current_month_members, data.previous_month_members),
        expected_members_in_next_year: calculateProjectedGrowth(data.total_num_members, data.monthly_member_growth_rate),
        monthly_content_growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
    };
}

function calculateKeyInsights(data) {
    return {
        key_metrics_insight_1: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
        key_metrics_insight_2: calculateGrowthRate(data.current_month_members, data.previous_month_members),
        key_metrics_insight_3: data.num_alive_blocks / data.total_num_members || 0,
        key_metrics_insight_4: (data.total_num_members + data.total_num_guests) || 0,
        key_metrics_insight_5: data.total_num_members / data.total_num_teamspaces || 0,
        key_metrics_insight_6: data.num_alive_pages / data.total_num_members || 0,
        key_metrics_insight_7: (data.num_alive_blocks / data.num_blocks * 100) || 0,
        key_metrics_insight_8: (data.num_alive_collections / data.num_collections * 100) || 0,
        key_metrics_insight_9: data.num_blocks / data.total_num_teamspaces || 0,
        key_metrics_insight_10: data.total_num_integrations || 0,
        key_metrics_insight_11: calculateTotalBots(data),
        key_metrics_insight_12: calculateTotalIntegrations(data),
        key_metrics_insight_13: (data.num_alive_pages / data.num_total_pages * 100) || 0,
        key_metrics_insight_14: (data.num_private_pages / data.num_total_pages * 100) || 0,
        key_metrics_insight_15: (data.total_num_collection_views / data.num_total_pages * 100) || 0,
        key_metrics_insight_16: (data.num_alive_blocks / data.num_blocks * 100) || 0,
        key_metrics_insight_17: data.num_alive_blocks / data.total_num_members || 0,
        key_metrics_insight_18: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
    };
}

function calculateCombinedMetrics(metrics) {
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
        success_improvement: calculateSuccessImprovement(metrics)
    };
}

function calculateROIMetrics(data, metrics) {
    const enterpriseCost = 20;
    const enterpriseAICost = 25;
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
        enterprise_plan_roi: calculateEnterpriseROI(metrics, current, enterprise),
        enterprise_plan_w_ai_roi: calculateEnterpriseROI(metrics, current, enterpriseAI, true)
    };
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
    return previous ? ((current - previous) / previous * 100) : 0;
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

function calculateNavComplexity(metrics) {
    return (metrics.max_depth * 0.3) + 
           (metrics.avg_depth * 0.3) + 
           (metrics.orphaned_blocks / metrics.total_pages * 0.4);
}

function calculateCollaborationScore(metrics) {
    return ((metrics.teamspaces_with_guests / metrics.total_num_teamspaces * 0.5) +
            (metrics.average_teamspace_members / 10 * 0.5)) * 100;
}

function calculateVisibilityScore(metrics) {
    return (metrics.num_public_pages / metrics.num_total_pages * 0.4) +
           (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
}

function calculateProductivityScore(metrics) {
    return (metrics.num_alive_blocks / metrics.total_num_members) / 100;
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

function calculateSecurityScore(metrics) {
    return (metrics.num_private_pages / metrics.num_total_pages * 0.4) +
           (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
}

function calculateSuccessImprovement(metrics) {
    return metrics.projected_organisation_score - metrics.current_organization_score;
}

function calculateIncrease(percentage, seats, newPlan, currentPlan) {
    return seats * (1 + percentage) * (newPlan - currentPlan);
}

function calculateEnterpriseROI(metrics, currentCost, newCost, includeAI = false) {
    const implementationCost = 5000;
    const projectedBenefit = metrics.current_productivity_score * (includeAI ? 1.4 : 1.2);
    return ((projectedBenefit - currentCost) / implementationCost) * 100;
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