export class CollaborationMetrics {
    constructor(calculator) {
        this.calculator = calculator;
    }

    calculateTeamMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3) {
            console.warn('No team metrics data available');
            return {};
        }

        const previousMembers = dataframe_5?.NUM_MEMBERS || dataframe_3.TOTAL_NUM_MEMBERS;
        const memberGrowth = ((dataframe_3.TOTAL_NUM_MEMBERS - previousMembers) / previousMembers) * 100;

        return {
            total_members: dataframe_3.TOTAL_NUM_MEMBERS || 0,
            total_guests: dataframe_3.TOTAL_NUM_GUESTS || 0,
            member_growth: memberGrowth,
            teamspaces: {
                total: dataframe_3.TOTAL_NUM_TEAMSPACES || 0,
                open: dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES || 0,
                closed: dataframe_3.TOTAL_NUM_CLOSED_TEAMSPACES || 0,
                private: dataframe_3.TOTAL_NUM_PRIVATE_TEAMSPACES || 0
            },
            automation: {
                total_bots: dataframe_3.TOTAL_NUM_BOTS || 0,
                internal_bots: dataframe_3.TOTAL_NUM_INTERNAL_BOTS || 0,
                public_bots: dataframe_3.TOTAL_NUM_PUBLIC_BOTS || 0,
                integrations: dataframe_3.TOTAL_NUM_INTEGRATIONS || 0
            },
            team_efficiency_score: this.calculateTeamEfficiencyScore(dataframe_3)
        };
    }

    calculateOrganizationMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3 || !dataframe_5) {
            console.warn('No organization data available');
            return {};
        }

        const total_pages = dataframe_3.TOTAL_NUM_TOTAL_PAGES || 0;
        const public_pages = dataframe_3.TOTAL_NUM_PUBLIC_PAGES || 0;
        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const total_teamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;

        // Calculate visibility score based on public vs private pages
        const current_visibility_score = (public_pages / total_pages) * 100;

        // Calculate collaboration score based on teamspaces and members
        const current_collaboration_score = total_teamspaces ? 
            Math.min(100, (total_members / total_teamspaces / this.calculator.INDUSTRY_AVERAGE_TEAM_SIZE) * 100) : 0;

        // Calculate productivity score based on pages per member
        const pages_per_member = total_members ? total_pages / total_members : 0;
        const current_productivity_score = Math.min(100, (pages_per_member / 10) * 100);

        // Calculate overall organization score
        const current_organization_score = 
            (current_visibility_score * 0.3) + 
            (current_collaboration_score * 0.3) + 
            (current_productivity_score * 0.4);

        return {
            current_visibility_score,
            current_collaboration_score,
            current_productivity_score,
            current_organization_score
        };
    }

    calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5) {
        const teamspaceMetrics = this.analyzeTeamspacePatterns(dataframe_3);
        const memberActivity = this.analyzeMemberActivity(dataframe_2, dataframe_3);
        
        return {
            team_adoption_score: this.calculateTeamAdoptionScore(memberActivity, teamspaceMetrics),
            collaboration_density: this.calculateCollaborationDensity(dataframe_3),
            knowledge_sharing_index: this.calculateKnowledgeSharingIndex(dataframe_2, dataframe_3),
            cross_team_collaboration_score: this.calculateCrossTeamCollaboration(dataframe_3),
            team_content_distribution: this.analyzeTeamContentDistribution(dataframe_2, dataframe_3)
        };
    }

    analyzeTeamspacePatterns(dataframe_3) {
        return {
            total_teamspaces: dataframe_3.TOTAL_NUM_TEAMSPACES,
            open_teamspaces: dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES,
            closed_teamspaces: dataframe_3.TOTAL_NUM_CLOSED_TEAMSPACES,
            private_teamspaces: dataframe_3.TOTAL_NUM_PRIVATE_TEAMSPACES,
            avg_members_per_teamspace: dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1),
            teamspace_utilization: (dataframe_3.TOTAL_NUM_TEAMSPACES / Math.ceil(dataframe_3.TOTAL_NUM_MEMBERS / this.calculator.INDUSTRY_AVERAGE_TEAM_SIZE)) * 100
        };
    }

    analyzeMemberActivity(dataframe_2, dataframe_3) {
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * this.calculator.MILLISECONDS_PER_DAY);
        const activePages = dataframe_2.filter(row => parseInt(row.CREATED_TIME) > thirtyDaysAgo).length;

        return {
            total_members: dataframe_3.TOTAL_NUM_MEMBERS,
            active_pages_per_member: activePages / dataframe_3.TOTAL_NUM_MEMBERS,
            content_per_member: dataframe_3.NUM_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS,
            collections_per_member: dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_MEMBERS
        };
    }

    calculateTeamAdoptionScore(memberActivity, teamspaceMetrics) {
        const contentScore = Math.min(memberActivity.content_per_member / 10, 1) * 100;
        const teamspaceScore = Math.min(teamspaceMetrics.teamspace_utilization, 100);
        const activityScore = Math.min(memberActivity.active_pages_per_member * 20, 100);

        return (contentScore * 0.4 + teamspaceScore * 0.3 + activityScore * 0.3);
    }

    calculateCollaborationDensity(dataframe_3) {
        const memberDensity = dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1);
        const optimalDensity = this.calculator.INDUSTRY_AVERAGE_TEAM_SIZE;
        const densityScore = Math.min((memberDensity / optimalDensity) * 100, 100);

        return {
            density_score: densityScore,
            members_per_teamspace: memberDensity,
            optimal_density: optimalDensity
        };
    }

    calculateKnowledgeSharingIndex(dataframe_2, dataframe_3) {
        const publicRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        const templateRatio = dataframe_2.filter(row => row.TYPE === 'template').length / dataframe_2.length;
        const collectionRatio = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;

        return (publicRatio * 40 + templateRatio * 30 + collectionRatio * 30);
    }

    calculateCrossTeamCollaboration(dataframe_3) {
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES;
        const openTeamspaces = dataframe_3.TOTAL_NUM_OPEN_TEAMSPACES;
        const sharedContentRatio = dataframe_3.TOTAL_NUM_PUBLIC_PAGES / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return (openTeamspaces / totalTeamspaces * 50) + (sharedContentRatio * 50);
    }

    analyzeTeamContentDistribution(dataframe_2, dataframe_3) {
        const totalContent = dataframe_3.NUM_BLOCKS;
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES;
        return {
            content_per_teamspace: totalContent / totalTeamspaces,
            distribution_score: Math.min(100, (totalContent / totalTeamspaces / 100) * 100)
        };
    }

    calculateTeamEfficiencyScore(dataframe_3) {
        const automationRatio = (dataframe_3.TOTAL_NUM_BOTS + dataframe_3.TOTAL_NUM_INTEGRATIONS) / dataframe_3.TOTAL_NUM_MEMBERS;
        const teamspaceUtilization = dataframe_3.TOTAL_NUM_MEMBERS / (dataframe_3.TOTAL_NUM_TEAMSPACES || 1);
        
        return Math.min(100, (automationRatio * 50) + (teamspaceUtilization / this.calculator.INDUSTRY_AVERAGE_TEAM_SIZE * 50));
    }
} 