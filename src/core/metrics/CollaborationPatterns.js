import { BaseMetrics } from './BaseMetrics.js';

export class CollaborationPatterns extends BaseMetrics {
    calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5) {
        this.validateData(dataframe_2, dataframe_3, dataframe_5);

        // Team Composition Metrics
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const totalGuests = dataframe_3.TOTAL_NUM_GUESTS || 0;
        const totalBots = dataframe_3.TOTAL_NUM_BOTS || 0;
        const totalIntegrations = dataframe_3.TOTAL_NUM_INTEGRATIONS || 0;

        // Teamspace Metrics
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        const openTeamspaces = dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES || 0;
        const closedTeamspaces = dataframe_3.TOTAL_NUM_CLOSED_TEAMSPACES || 0;
        const privateTeamspaces = dataframe_3.TOTAL_NUM_PRIVATE_TEAMSPACES || 0;
        const permissionGroups = dataframe_3.TOTAL_NUM_PERMISSION_GROUPS || 0;

        // Calculate Advanced Metrics
        const averageTeamspaceMembers = totalMembers / totalTeamspaces;
        const teamspaceDistribution = this.calculateTeamspaceDistribution({
            openTeamspaces,
            closedTeamspaces,
            privateTeamspaces,
            totalTeamspaces
        });

        const collaborationMetrics = this.calculateCollaborationMetrics({
            totalMembers,
            totalGuests,
            totalTeamspaces,
            permissionGroups
        });

        const teamAdoption = this.calculateTeamAdoption({
            totalMembers,
            totalTeamspaces,
            openTeamspaces
        });

        return {
            // Team Composition
            total_members: totalMembers,
            total_guests: totalGuests,
            total_bots: totalBots,
            total_integrations: totalIntegrations,
            
            // Teamspace Structure
            total_teamspaces: totalTeamspaces,
            open_teamspaces: openTeamspaces,
            closed_teamspaces: closedTeamspaces,
            private_teamspaces: privateTeamspaces,
            permission_groups: permissionGroups,
            
            // Derived Metrics
            average_teamspace_members: this.formatDecimal(averageTeamspaceMembers),
            teamspace_distribution: teamspaceDistribution,
            
            // Collaboration Scores
            team_adoption_score: this.formatPercentage(teamAdoption),
            collaboration_density: this.formatPercentage(collaborationMetrics.density),
            cross_team_collaboration: this.formatPercentage(collaborationMetrics.crossTeam),
            
            // Additional Insights
            workspace_accessibility: this.formatPercentage(openTeamspaces / totalTeamspaces),
            permission_complexity: this.formatPercentage(permissionGroups / totalTeamspaces),
            guest_ratio: this.formatPercentage(totalGuests / totalMembers),
            automation_level: this.formatPercentage((totalBots + totalIntegrations) / totalMembers)
        };
    }

    calculateTeamspaceDistribution({ openTeamspaces, closedTeamspaces, privateTeamspaces, totalTeamspaces }) {
        if (totalTeamspaces === 0) return { open: '0%', closed: '0%', private: '0%' };

        return {
            open: this.formatPercentage(openTeamspaces / totalTeamspaces),
            closed: this.formatPercentage(closedTeamspaces / totalTeamspaces),
            private: this.formatPercentage(privateTeamspaces / totalTeamspaces)
        };
    }

    calculateCollaborationMetrics({ totalMembers, totalGuests, totalTeamspaces, permissionGroups }) {
        if (totalMembers === 0) return { density: 0, crossTeam: 0 };

        const density = (totalTeamspaces * (totalMembers + totalGuests)) / 
                       (totalMembers * totalMembers);
        
        const crossTeam = Math.min(
            permissionGroups / (totalTeamspaces || 1),
            1
        );

        return {
            density: Math.min(density, 1),
            crossTeam
        };
    }

    calculateTeamAdoption({ totalMembers, totalTeamspaces, openTeamspaces }) {
        if (totalMembers === 0 || totalTeamspaces === 0) return 0;

        const openTeamspaceRatio = openTeamspaces / totalTeamspaces;
        const teamspacePerMember = totalTeamspaces / totalMembers;

        return Math.min(
            (openTeamspaceRatio * 0.6) + (teamspacePerMember * 0.4),
            1
        );
    }
} 