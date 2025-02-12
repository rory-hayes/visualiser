import { BaseMetrics } from './BaseMetrics.js';

export class CollaborationPatterns extends BaseMetrics {
    calculateCollaborationPatterns(dataframe_2, dataframe_3, dataframe_5) {
        this.validateData(dataframe_2, dataframe_3, dataframe_5);

        const teamAdoptionScore = this.calculateTeamAdoptionScore(dataframe_5);
        const collaborationDensity = this.calculateCollaborationDensity(dataframe_3);
        const knowledgeSharingIndex = this.calculateKnowledgeSharingIndex(dataframe_2, dataframe_3);
        const crossTeamCollaborationScore = this.calculateCrossTeamCollaborationScore(dataframe_3, dataframe_5);

        return {
            team_adoption_score: teamAdoptionScore,
            collaboration_density: collaborationDensity,
            knowledge_sharing_index: knowledgeSharingIndex,
            cross_team_collaboration_score: crossTeamCollaborationScore
        };
    }

    calculateTeamAdoptionScore(workspace) {
        const totalMembers = workspace.NUM_MEMBERS;
        const activeMembers = workspace.NUM_MEMBERS - workspace.NUM_GUESTS;
        const teamspaceUtilization = workspace.NUM_TEAMSPACES > 0 ? 
            workspace.NUM_MEMBERS / workspace.NUM_TEAMSPACES : 0;
        
        const membershipScore = activeMembers / totalMembers;
        const teamspaceScore = Math.min(teamspaceUtilization / 10, 1); // Normalize to 10 members per teamspace
        
        return ((membershipScore + teamspaceScore) / 2) * 100;
    }

    calculateCollaborationDensity(workspace) {
        const totalInteractions = workspace.NUM_BLOCKS;
        const potentialInteractions = workspace.TOTAL_NUM_MEMBERS * workspace.NUM_PAGES;
        
        return potentialInteractions > 0 ? 
            (totalInteractions / potentialInteractions) * 100 : 0;
    }

    calculateKnowledgeSharingIndex(pages, workspace) {
        const sharedPages = pages.filter(p => 
            p.TYPE === 'collection_view_page' || 
            p.TYPE === 'collection_view'
        ).length;
        
        const sharingRatio = sharedPages / workspace.NUM_PAGES;
        const memberContribution = workspace.NUM_BLOCKS / workspace.TOTAL_NUM_MEMBERS;
        
        return ((sharingRatio + (memberContribution / 100)) / 2) * 100;
    }

    calculateCrossTeamCollaborationScore(workspace, workspaceDetails) {
        const teamspaces = workspaceDetails.NUM_TEAMSPACES;
        const totalCollaborations = workspace.NUM_COLLECTION_VIEWS;
        const potentialCollaborations = teamspaces * (teamspaces - 1) / 2;
        
        const collaborationScore = potentialCollaborations > 0 ? 
            totalCollaborations / potentialCollaborations : 0;
        
        return Math.min(collaborationScore * 100, 100);
    }
} 