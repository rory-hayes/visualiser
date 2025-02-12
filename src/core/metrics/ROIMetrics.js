import { BaseMetrics } from './BaseMetrics.js';

export class ROIMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.PLAN_COSTS = {
            team: 10,
            enterprise: 25,
            enterprise_ai: 35
        };
        this.TIME_VALUE_PER_HOUR = 50; // Average hourly cost of employee time
        this.HOURS_PER_MONTH = 160;    // Average working hours per month
    }

    calculateROIMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        const currentPlan = this.calculateCurrentPlanCost(dataframe_3);
        const enterpriseROI = this.calculateEnterpriseROI(dataframe_3, dataframe_5);
        const aiROI = this.calculateEnterpriseWithAIROI(dataframe_3, dataframe_5);
        const growthScenarios = this.calculateGrowthScenarios(dataframe_3);

        return {
            currentPlanCost: currentPlan.monthlyCost,
            annualCost: currentPlan.annualCost,
            enterprisePlanROI: enterpriseROI.roi,
            enterprisePlanSavings: enterpriseROI.annualSavings,
            enterpriseAIROI: aiROI.roi,
            enterpriseAISavings: aiROI.annualSavings,
            growthScenarios: {
                tenPercent: growthScenarios[10],
                twentyPercent: growthScenarios[20],
                fiftyPercent: growthScenarios[50]
            },
            projectedTimeSavings: this.calculateProjectedTimeSavings(dataframe_3, dataframe_5),
            automationPotential: this.calculateAutomationPotential(dataframe_3)
        };
    }

    calculateCurrentPlanCost(dataframe_3) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const monthlyCost = totalMembers * this.PLAN_COSTS.team;
        
        return {
            monthlyCost,
            annualCost: monthlyCost * 12
        };
    }

    calculateEnterpriseROI(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const currentCost = this.calculateCurrentPlanCost(dataframe_3).annualCost;
        const enterpriseCost = totalMembers * this.PLAN_COSTS.enterprise * 12;
        
        // Calculate productivity gains
        const productivityGain = this.calculateProductivityGain(dataframe_3, dataframe_5);
        const annualSavings = (productivityGain * totalMembers * this.TIME_VALUE_PER_HOUR * this.HOURS_PER_MONTH * 12) - 
                            (enterpriseCost - currentCost);

        return {
            roi: annualSavings / enterpriseCost,
            annualSavings
        };
    }

    calculateEnterpriseWithAIROI(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const currentCost = this.calculateCurrentPlanCost(dataframe_3).annualCost;
        const enterpriseAICost = totalMembers * this.PLAN_COSTS.enterprise_ai * 12;
        
        // Calculate enhanced productivity gains with AI
        const baseProductivityGain = this.calculateProductivityGain(dataframe_3, dataframe_5);
        const aiProductivityBoost = this.calculateAIProductivityBoost(dataframe_3);
        const totalProductivityGain = baseProductivityGain * (1 + aiProductivityBoost);
        
        const annualSavings = (totalProductivityGain * totalMembers * this.TIME_VALUE_PER_HOUR * this.HOURS_PER_MONTH * 12) - 
                            (enterpriseAICost - currentCost);

        return {
            roi: annualSavings / enterpriseAICost,
            annualSavings
        };
    }

    calculateGrowthScenarios(dataframe_3) {
        const scenarios = {};
        const growthRates = [10, 20, 50]; // Percentage growth rates to analyze

        growthRates.forEach(rate => {
            const growthFactor = 1 + (rate / 100);
            const projectedMembers = Math.ceil(dataframe_3.TOTAL_NUM_MEMBERS * growthFactor);
            
            const currentCost = this.calculatePlanCost(projectedMembers, 'team');
            const enterpriseCost = this.calculatePlanCost(projectedMembers, 'enterprise');
            const enterpriseAICost = this.calculatePlanCost(projectedMembers, 'enterprise_ai');
            
            scenarios[rate] = {
                projectedMembers,
                currentPlanCost: currentCost,
                enterpriseSavings: currentCost - enterpriseCost,
                enterpriseAISavings: currentCost - enterpriseAICost
            };
        });

        return scenarios;
    }

    calculateProjectedTimeSavings(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const interactions = dataframe_5 || [];
        
        // Calculate average time saved per interaction
        const averageTimeSaved = interactions.reduce((acc, interaction) => {
            // Assume each interaction saves 2-5 minutes
            return acc + (Math.random() * 3 + 2);
        }, 0) / (interactions.length || 1);

        // Project monthly time savings
        const monthlyInteractions = interactions.length;
        const monthlyMinutesSaved = averageTimeSaved * monthlyInteractions;
        const monthlyHoursSaved = monthlyMinutesSaved / 60;

        return {
            hoursPerMember: monthlyHoursSaved / totalMembers,
            totalHours: monthlyHoursSaved,
            monetaryValue: monthlyHoursSaved * this.TIME_VALUE_PER_HOUR
        };
    }

    calculateAutomationPotential(dataframe_3) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        const totalCollaborations = dataframe_3.TOTAL_COLLABORATIONS || 0;

        // Calculate automation potential based on various factors
        const teamspaceScore = Math.min(1, totalTeamspaces / (totalMembers * 0.2));
        const collaborationScore = Math.min(1, totalCollaborations / (totalMembers * 10));
        
        // Weight the scores
        const weightedScore = (teamspaceScore * 0.4) + (collaborationScore * 0.6);
        
        return {
            score: weightedScore,
            potentialSavings: this.calculateAutomationSavings(weightedScore, totalMembers)
        };
    }

    calculateProductivityGain(dataframe_3, dataframe_5) {
        const baseGain = 0.15; // Base productivity improvement
        const collaborationFactor = this.calculateCollaborationFactor(dataframe_3);
        const usageFactor = this.calculateUsageFactor(dataframe_5);
        
        return baseGain * (1 + collaborationFactor) * (1 + usageFactor);
    }

    calculateAIProductivityBoost(dataframe_3) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const baseBoost = 0.2; // Base AI productivity boost
        
        // Scale boost based on team size
        const scaleFactor = Math.min(1, Math.log10(totalMembers) / Math.log10(100));
        
        return baseBoost * (1 + scaleFactor);
    }

    calculatePlanCost(members, plan) {
        return members * this.PLAN_COSTS[plan] * 12;
    }

    calculateAutomationSavings(automationScore, totalMembers) {
        // Assume each member could save 1-5 hours per week through automation
        const potentialHoursPerWeek = totalMembers * (automationScore * 4 + 1);
        const potentialHoursPerYear = potentialHoursPerWeek * 52;
        
        return potentialHoursPerYear * this.TIME_VALUE_PER_HOUR;
    }

    calculateCollaborationFactor(dataframe_3) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const totalCollaborations = dataframe_3.TOTAL_COLLABORATIONS || 0;
        
        if (totalMembers <= 1) return 0;
        
        const collaborationsPerMember = totalCollaborations / totalMembers;
        return Math.min(0.5, collaborationsPerMember / 10);
    }

    calculateUsageFactor(dataframe_5) {
        if (!dataframe_5 || dataframe_5.length === 0) return 0;
        
        const recentInteractions = dataframe_5.filter(interaction => {
            const interactionDate = new Date(interaction.LAST_INTERACTION_TIME);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return interactionDate >= thirtyDaysAgo;
        }).length;

        return Math.min(0.5, recentInteractions / (dataframe_5.length * 0.3));
    }
}
