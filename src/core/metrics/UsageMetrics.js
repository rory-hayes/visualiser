import { BaseMetrics } from './BaseMetrics.js';

export class UsageMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.ACTIVE_THRESHOLD_DAYS = 30;
        this.COLLABORATION_THRESHOLD = 3;
    }

    calculateUsageMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        const workspace = dataframe_5[0] || {};
        
        // Member and Guest Metrics
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const totalGuests = workspace.NUM_GUESTS || 0;
        const totalBots = workspace.NUM_BOTS || 0;
        const totalIntegrations = workspace.NUM_INTEGRATIONS || 0;

        // Engagement Metrics
        const aliveBlocks = workspace.NUM_ALIVE_BLOCKS || 0;
        const totalBlocks = workspace.NUM_BLOCKS || 0;
        const engagementRate = this.calculateEngagementRate(aliveBlocks, totalBlocks);

        // Teamspace Metrics
        const totalTeamspaces = workspace.NUM_TEAMSPACES || 0;
        const openTeamspaces = workspace.NUM_OPEN_TEAMSPACES || 0;
        const closedTeamspaces = workspace.NUM_CLOSED_TEAMSPACES || 0;
        const privateTeamspaces = workspace.NUM_PRIVATE_TEAMSPACES || 0;

        // Bot and Integration Metrics
        const botMetrics = this.calculateBotMetrics(workspace);
        const integrationMetrics = this.calculateIntegrationMetrics(workspace);

        // Teamspace Distribution Analysis
        const teamspaceDistribution = this.calculateTeamspaceDistribution(workspace);

        return {
            // Member Metrics
            total_members: totalMembers,
            total_guests: totalGuests,
            member_guest_ratio: totalGuests > 0 ? totalMembers / totalGuests : totalMembers,
            
            // Engagement Metrics
            engagement_rate: engagementRate,
            content_activity_score: this.calculateContentActivityScore(workspace),
            
            // Teamspace Metrics
            total_teamspaces: totalTeamspaces,
            teamspace_distribution: teamspaceDistribution,
            average_members_per_teamspace: totalMembers / totalTeamspaces,
            teamspace_health_score: this.calculateTeamspaceHealthScore(workspace),
            
            // Bot and Integration Metrics
            ...botMetrics,
            ...integrationMetrics,
            
            // Collaboration Metrics
            collaboration_score: this.calculateCollaborationScore(workspace),
            cross_team_activity: this.calculateCrossTeamActivity(workspace)
        };
    }

    calculateEngagementRate(aliveBlocks, totalBlocks) {
        if (totalBlocks === 0) return 0;
        return aliveBlocks / totalBlocks;
    }

    calculateContentActivityScore(workspace) {
        const totalPages = workspace.NUM_TOTAL_PAGES || 0;
        const alivePages = workspace.NUM_ALIVE_TOTAL_PAGES || 0;
        const publicPages = workspace.NUM_PUBLIC_PAGES || 0;
        
        if (totalPages === 0) return 0;
        
        const pageActivityRatio = alivePages / totalPages;
        const publicContentRatio = publicPages / totalPages;
        
        return (pageActivityRatio * 0.7 + publicContentRatio * 0.3);
    }

    calculateTeamspaceDistribution(workspace) {
        const total = workspace.NUM_TEAMSPACES || 0;
        if (total === 0) return { open: 0, closed: 0, private: 0 };

        return {
            open: (workspace.NUM_OPEN_TEAMSPACES || 0) / total,
            closed: (workspace.NUM_CLOSED_TEAMSPACES || 0) / total,
            private: (workspace.NUM_PRIVATE_TEAMSPACES || 0) / total
        };
    }

    calculateTeamspaceHealthScore(workspace) {
        const totalTeamspaces = workspace.NUM_TEAMSPACES || 0;
        if (totalTeamspaces === 0) return 0;

        const distribution = this.calculateTeamspaceDistribution(workspace);
        const balanceScore = 1 - Math.abs(distribution.open - 0.4) - Math.abs(distribution.closed - 0.4) - Math.abs(distribution.private - 0.2);
        
        return Math.max(0, balanceScore);
    }

    calculateBotMetrics(workspace) {
        const totalBots = workspace.NUM_BOTS || 0;
        const internalBots = workspace.NUM_INTERNAL_BOTS || 0;
        const publicBots = workspace.NUM_PUBLIC_BOTS || 0;
        const linkPreviewBots = workspace.NUM_LINK_PREVIEW_BOTS || 0;

        return {
            total_bots: totalBots,
            bot_distribution: {
                internal: internalBots / totalBots || 0,
                public: publicBots / totalBots || 0,
                link_preview: linkPreviewBots / totalBots || 0
            },
            bot_utilization_score: this.calculateBotUtilizationScore(workspace)
        };
    }

    calculateIntegrationMetrics(workspace) {
        const totalIntegrations = workspace.NUM_INTEGRATIONS || 0;
        const publicIntegrations = workspace.NUM_PUBLIC_INTEGRATIONS || 0;
        const linkPreviewIntegrations = workspace.NUM_LINK_PREVIEW_INTEGRATIONS || 0;

        return {
            total_integrations: totalIntegrations,
            integration_distribution: {
                public: publicIntegrations / totalIntegrations || 0,
                link_preview: linkPreviewIntegrations / totalIntegrations || 0
            },
            integration_adoption_score: this.calculateIntegrationAdoptionScore(workspace)
        };
    }

    calculateBotUtilizationScore(workspace) {
        const totalBots = workspace.NUM_BOTS || 0;
        const totalMembers = workspace.NUM_MEMBERS || 0;
        if (totalMembers === 0) return 0;

        const botRatio = totalBots / totalMembers;
        return Math.min(botRatio / 0.5, 1); // Normalize to 0-1, assuming 0.5 bots per member is optimal
    }

    calculateIntegrationAdoptionScore(workspace) {
        const totalIntegrations = workspace.NUM_INTEGRATIONS || 0;
        const totalTeamspaces = workspace.NUM_TEAMSPACES || 0;
        if (totalTeamspaces === 0) return 0;

        const integrationRatio = totalIntegrations / totalTeamspaces;
        return Math.min(integrationRatio / 2, 1); // Normalize to 0-1, assuming 2 integrations per teamspace is optimal
    }

    calculateCollaborationScore(workspace) {
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const permissionGroups = workspace.NUM_PERMISSION_GROUPS || 0;
        if (totalMembers === 0) return 0;

        const groupDensity = permissionGroups / totalMembers;
        return Math.min(groupDensity / 0.2, 1); // Normalize to 0-1, assuming 1 group per 5 members is optimal
    }

    calculateCrossTeamActivity(workspace) {
        const totalTeamspaces = workspace.NUM_TEAMSPACES || 0;
        const permissionGroups = workspace.NUM_PERMISSION_GROUPS || 0;
        if (totalTeamspaces === 0) return 0;

        const crossTeamRatio = permissionGroups / totalTeamspaces;
        return Math.min(crossTeamRatio / 2, 1); // Normalize to 0-1, assuming 2 permission groups per teamspace is optimal
    }
}
