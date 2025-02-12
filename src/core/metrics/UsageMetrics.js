import { BaseMetrics } from './BaseMetrics.js';

export class UsageMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.ACTIVE_THRESHOLD_DAYS = 30;
        this.COLLABORATION_THRESHOLD = 3;
    }

    calculateUsageMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        const memberActivity = this.analyzeMemberActivity(dataframe_3, dataframe_5);
        const teamspacePatterns = this.analyzeTeamspacePatterns(dataframe_3);
        const collaborationDensity = this.calculateCollaborationDensity(dataframe_3);

        return {
            totalMembers: dataframe_3.TOTAL_NUM_MEMBERS || 0,
            totalGuests: dataframe_3.TOTAL_NUM_GUESTS || 0,
            activeMembers: memberActivity.activeMembers,
            dailyActiveUsers: memberActivity.dailyActive,
            weeklyActiveUsers: memberActivity.weeklyActive,
            monthlyActiveUsers: memberActivity.monthlyActive,
            totalTeamspaces: teamspacePatterns.total,
            averageTeamspaceMembers: teamspacePatterns.avgMembers,
            collaborationRate: collaborationDensity,
            teamAdoptionScore: this.calculateTeamAdoptionScore(memberActivity, teamspacePatterns),
            engagementScore: this.calculateEngagementScore(memberActivity)
        };
    }

    analyzeMemberActivity(dataframe_3, dataframe_5) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        const interactions = dataframe_5 || [];
        const activeMembers = new Set();
        const dailyActive = new Set();
        const weeklyActive = new Set();
        const monthlyActive = new Set();

        interactions.forEach(interaction => {
            const userId = interaction.USER_ID;
            const timestamp = new Date(interaction.LAST_INTERACTION_TIME).getTime();
            const daysDiff = (now - timestamp) / dayMs;

            if (daysDiff <= this.ACTIVE_THRESHOLD_DAYS) {
                activeMembers.add(userId);
                if (daysDiff <= 1) dailyActive.add(userId);
                if (daysDiff <= 7) weeklyActive.add(userId);
                if (daysDiff <= 30) monthlyActive.add(userId);
            }
        });

        return {
            activeMembers: activeMembers.size,
            dailyActive: dailyActive.size,
            weeklyActive: weeklyActive.size,
            monthlyActive: monthlyActive.size
        };
    }

    analyzeTeamspacePatterns(dataframe_3) {
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;

        return {
            total: totalTeamspaces,
            avgMembers: totalTeamspaces > 0 ? totalMembers / totalTeamspaces : 0
        };
    }

    calculateCollaborationDensity(dataframe_3) {
        const totalCollaborations = dataframe_3.TOTAL_COLLABORATIONS || 0;
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;

        if (totalMembers <= 1) return 0;
        return totalCollaborations / (totalMembers * (totalMembers - 1) / 2);
    }

    calculateTeamAdoptionScore(memberActivity, teamspacePatterns) {
        const activeRatio = memberActivity.monthlyActive / (teamspacePatterns.total * teamspacePatterns.avgMembers);
        const teamspaceUtilization = Math.min(1, teamspacePatterns.avgMembers / this.COLLABORATION_THRESHOLD);
        
        return (activeRatio + teamspaceUtilization) / 2;
    }

    calculateEngagementScore(memberActivity) {
        const weights = {
            daily: 0.5,
            weekly: 0.3,
            monthly: 0.2
        };

        const totalMembers = Math.max(
            memberActivity.monthlyActive,
            memberActivity.activeMembers
        );

        if (totalMembers === 0) return 0;

        return (
            (weights.daily * memberActivity.dailyActive / totalMembers) +
            (weights.weekly * memberActivity.weeklyActive / totalMembers) +
            (weights.monthly * memberActivity.monthlyActive / totalMembers)
        );
    }
}
