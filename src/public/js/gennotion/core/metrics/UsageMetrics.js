export class UsageMetrics {
    constructor(calculator) {
        this.calculator = calculator;
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
            (total_num_integrations / this.calculator.RECOMMENDED_INTEGRATIONS) * 100;
        
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
        const oneDayAgo = now - this.calculator.MILLISECONDS_PER_DAY;
        const dau = new Set(
            dataframe_5
                .filter(row => parseInt(row.LAST_INTERACTION_TIME) > oneDayAgo)
                .map(row => row.USER_ID)
        ).size;

        // Calculate monthly active users (MAU)
        const thirtyDaysAgo = now - (30 * this.calculator.MILLISECONDS_PER_DAY);
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

    calculateAdvancedUsagePatterns(dataframe_2, dataframe_3, dataframe_5) {
        return {
            automation_effectiveness: this.calculateAutomationEffectiveness(dataframe_3),
            integration_impact_score: this.calculateIntegrationImpact(dataframe_3),
            feature_utilization_index: this.calculateFeatureUtilization(dataframe_2, dataframe_3),
            advanced_features_adoption: this.calculateAdvancedFeaturesAdoption(dataframe_2),
            workflow_optimization_score: this.calculateWorkflowOptimization(dataframe_3)
        };
    }

    calculateAutomationEffectiveness(dataframe_3) {
        const automationRatio = (dataframe_3.TOTAL_NUM_BOTS + dataframe_3.TOTAL_NUM_INTEGRATIONS) / 
                               dataframe_3.TOTAL_NUM_MEMBERS;
        return Math.min(100, automationRatio * 100);
    }

    calculateIntegrationImpact(dataframe_3) {
        const integrationRatio = dataframe_3.TOTAL_NUM_INTEGRATIONS / this.calculator.RECOMMENDED_INTEGRATIONS;
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
} 