import { BaseMetrics } from './BaseMetrics.js';

export class UsageMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.ACTIVE_THRESHOLD_DAYS = 30;
        this.COLLABORATION_THRESHOLD = 3;
    }

    calculateUsageMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        const memberActivity = this.analyzeMemberActivity(dataframe_3, dataframe_5[0]);
        const teamspacePatterns = this.analyzeTeamspacePatterns(dataframe_3);
        const collaborationDensity = this.calculateCollaborationDensity(dataframe_3);

        return {
            totalMembers: dataframe_5[0]?.NUM_MEMBERS || 0,
            totalGuests: dataframe_5[0]?.NUM_GUESTS || 0,
            activeMembers: memberActivity.activeMembers,
            dailyActiveUsers: memberActivity.dailyActive,
            weeklyActiveUsers: memberActivity.weeklyActive,
            monthlyActiveUsers: memberActivity.monthlyActive,
            totalTeamspaces: teamspacePatterns.total,
            averageTeamspaceMembers: teamspacePatterns.avgMembers,
            collaborationDensity: collaborationDensity,
            teamAdoptionScore: this.calculateTeamAdoptionScore(memberActivity, teamspacePatterns),
            engagementScore: this.calculateEngagementScore(memberActivity),
            knowledgeSharingIndex: this.calculateKnowledgeSharingIndex(dataframe_3, dataframe_5[0]),
            crossTeamCollaborationScore: this.calculateCrossTeamCollaboration(dataframe_3, dataframe_5[0]),
            collaborationEfficiency: this.calculateCollaborationEfficiency(dataframe_3, dataframe_5[0]),
            teamInteractionScore: this.calculateTeamInteractionScore(dataframe_3, dataframe_5[0]),
            collaborationFactor: this.calculateCollaborationFactor(dataframe_3, dataframe_5[0]),
            usageFactor: this.calculateUsageFactor(dataframe_5[0]),
            totalIntegrations: dataframe_3.NUM_INTEGRATIONS || 0
        };
    }

    analyzeMemberActivity(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_5?.NUM_MEMBERS || 0;
        const activeMembers = Math.round(totalMembers * 0.8); // Estimate active members as 80% of total
        const dailyActive = Math.round(totalMembers * 0.3); // Estimate 30% daily active
        const weeklyActive = Math.round(totalMembers * 0.5); // Estimate 50% weekly active
        const monthlyActive = Math.round(totalMembers * 0.7); // Estimate 70% monthly active

        return {
            totalMembers,
            activeMembers,
            dailyActive,
            weeklyActive,
            monthlyActive
        };
    }

    analyzeTeamspacePatterns(dataframe_3) {
        const totalTeamspaces = dataframe_3.NUM_TEAMSPACES || 0;
        const totalMembers = dataframe_3.NUM_MEMBERS || 0;

        return {
            total: totalTeamspaces,
            avgMembers: totalTeamspaces > 0 ? totalMembers / totalTeamspaces : 0
        };
    }

    calculateCollaborationDensity(dataframe_3) {
        const totalTeamspaces = dataframe_3.NUM_TEAMSPACES || 0;
        const totalMembers = dataframe_3.NUM_MEMBERS || 0;

        if (totalMembers <= 1) return 0;
        return Math.min(totalTeamspaces / totalMembers, 1);
    }

    calculateTeamAdoptionScore(memberActivity, teamspacePatterns) {
        if (memberActivity.totalMembers === 0) return 0;
        return Math.min(memberActivity.activeMembers / memberActivity.totalMembers, 1);
    }

    calculateEngagementScore(memberActivity) {
        if (memberActivity.totalMembers === 0) return 0;
        return memberActivity.monthlyActive / memberActivity.totalMembers;
    }

    calculateKnowledgeSharingIndex(dataframe_3, dataframe_5) {
        const totalPages = dataframe_5?.NUM_TOTAL_PAGES || 0;
        const publicPages = dataframe_5?.NUM_PUBLIC_PAGES || 0;
        return totalPages > 0 ? publicPages / totalPages : 0;
    }

    calculateCrossTeamCollaboration(dataframe_3, dataframe_5) {
        const totalTeamspaces = dataframe_5?.NUM_TEAMSPACES || 0;
        const permissionGroups = dataframe_5?.NUM_PERMISSION_GROUPS || 0;
        return totalTeamspaces > 0 ? Math.min(permissionGroups / totalTeamspaces, 1) : 0;
    }

    calculateCollaborationEfficiency(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_5?.NUM_MEMBERS || 0;
        const totalPages = dataframe_5?.NUM_TOTAL_PAGES || 0;
        return totalMembers > 0 ? Math.min(totalPages / (totalMembers * 100), 1) : 0;
    }

    calculateTeamInteractionScore(dataframe_3, dataframe_5) {
        const openTeamspaces = dataframe_5?.NUM_OPEN_TEAMSPACES || 0;
        const totalTeamspaces = dataframe_5?.NUM_TEAMSPACES || 0;
        return totalTeamspaces > 0 ? openTeamspaces / totalTeamspaces : 0;
    }

    calculateCollaborationFactor(dataframe_3, dataframe_5) {
        const teamInteraction = this.calculateTeamInteractionScore(dataframe_3, dataframe_5);
        const crossTeam = this.calculateCrossTeamCollaboration(dataframe_3, dataframe_5);
        return (teamInteraction + crossTeam) / 2;
    }

    calculateUsageFactor(dataframe_5) {
        const totalPages = dataframe_5?.NUM_TOTAL_PAGES || 0;
        const alivePages = dataframe_5?.NUM_ALIVE_TOTAL_PAGES || 0;
        return totalPages > 0 ? alivePages / totalPages : 0;
    }
}
