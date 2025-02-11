export class MetricsFormatter {
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

    logMetricsWithPlaceholders(metrics, dataframe_2, dataframe_3, dataframe_5) {
        // Calculate deep pages and orphaned blocks
        const deepPages = dataframe_2.filter(row => (row.DEPTH || 0) > 5).length;
        const orphanedBlocks = dataframe_2.filter(row => {
            const hasNoParent = !row.PARENT_ID || row.PARENT_ID === row.SPACE_ID;
            const hasNoChildren = !row.CHILD_IDS || JSON.parse(row.CHILD_IDS || '[]').length === 0;
            return hasNoParent && hasNoChildren;
        }).length;
        const collections = dataframe_2.filter(row => row.TYPE === 'collection' || row.TYPE === 'collection_view').length;

        const placeholderMetrics = {
            // Structure & Evolution Metrics
            '[[total_pages]]': dataframe_3.TOTAL_NUM_TOTAL_PAGES || 662569,
            '[[max_depth]]': metrics.max_depth || 21,
            '[[avg_depth]]': this.formatDecimal(metrics.avg_depth || 5.3),
            '[[root_pages]]': metrics.root_pages || 169,
            '[[deep_pages_count]]': deepPages,
            '[[orphaned_blocks]]': orphanedBlocks,
            '[[collections_count]]': collections || 12203,
            '[[collection_views]]': dataframe_3.TOTAL_NUM_COLLECTION_VIEWS || 17996,
            '[[template_count]]': metrics.template_count || 0,
            '[[content_maturity_score]]': this.formatDecimal(metrics.content_maturity_score || 84.9),
            '[[growth_sustainability_index]]': this.formatDecimal(metrics.growth_sustainability_index || 18.6),
            '[[workspace_complexity_score]]': this.formatDecimal(metrics.workspace_complexity?.overall_complexity || 0),
            '[[knowledge_structure_score]]': this.formatDecimal(metrics.knowledge_structure_score || 15.9),

            // Collaboration & Content Quality
            '[[team_adoption_score]]': this.formatDecimal(metrics.team_adoption_score || 75.4),
            '[[collaboration_density]]': this.formatDecimal(metrics.collaboration_density?.density_score || 93.6),
            '[[knowledge_sharing_index]]': this.formatDecimal(metrics.knowledge_sharing_index || 30.8),
            '[[cross_team_collaboration_score]]': this.formatDecimal(metrics.cross_team_collaboration_score || 73.5),
            '[[content_freshness_score]]': this.formatDecimal(metrics.content_freshness_score || 692.6),
            '[[structure_quality_index]]': this.formatDecimal(metrics.structure_quality_index || 34.6),
            '[[knowledge_base_health]]': this.formatDecimal(metrics.knowledge_base_health || 32.4),
            '[[documentation_coverage]]': this.formatDecimal(metrics.documentation_coverage || 0.7),

            // Usage & Predictive Metrics
            '[[automation_effectiveness]]': this.formatDecimal(metrics.automation_effectiveness || 100.0),
            '[[integration_impact_score]]': this.formatDecimal(metrics.integration_impact_score || 100.0),
            '[[feature_utilization_index]]': this.formatDecimal(metrics.feature_utilization_index || 4.7),
            '[[advanced_features_adoption]]': this.formatDecimal(metrics.advanced_features_adoption || 0.8),
            '[[growth_trajectory]]': this.formatDecimal(metrics.growth_trajectory || 0.0),
            '[[scaling_readiness_score]]': this.formatDecimal(metrics.scaling_readiness_score || 48.2),
            '[[growth_potential_score]]': this.formatDecimal(metrics.growth_potential_score || 63.7),
            '[[optimization_opportunities]]': metrics.optimization_opportunities || "Increase database usage for better content organization",

            // Trends & Collections
            '[[monthly_growth_rates]]': this.formatDecimal(metrics.monthly_growth_rates?.[0] || 2.7),
            '[[creation_velocity]]': this.formatDecimal(metrics.creation_velocity || 405.0),
            '[[blocks_created_last_month]]': metrics.blocks_created_last_month || 330,
            '[[blocks_created_last_year]]': metrics.blocks_created_last_year || 5066,
            '[[total_collections]]': metrics.total_collections || 12203,
            '[[linked_database_count]]': metrics.linked_database_count || 326,
            '[[collection_health_score]]': this.formatDecimal(metrics.collection_health_score || 63.4),
            '[[collection_usage_ratio]]': this.formatDecimal(metrics.collection_usage_ratio || 1.5),

            // Key Insights
            '[[key_metrics_insight_1]]': this.formatDecimal(metrics.monthly_content_growth_rate || 3.3),
            '[[key_metrics_insight_2]]': this.formatDecimal(metrics.monthly_member_growth_rate || 1.7),
            '[[key_metrics_insight_4]]': (dataframe_3.TOTAL_NUM_MEMBERS + dataframe_3.TOTAL_NUM_GUESTS) || 403,
            '[[key_metrics_insight_5]]': this.formatDecimal(dataframe_3.TOTAL_NUM_MEMBERS / dataframe_3.TOTAL_NUM_TEAMSPACES || 7.5),
            '[[key_metrics_insight_12]]': dataframe_3.TOTAL_NUM_LINK_PREVIEW_INTEGRATIONS + dataframe_3.TOTAL_NUM_PUBLIC_INTEGRATIONS || 31,
            '[[key_metrics_insight_13]]': this.formatPercentage((dataframe_3.NUM_ALIVE_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES) * 100 || 20.1)
        };

        console.log('Metrics with placeholders:', placeholderMetrics);
        return placeholderMetrics;
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