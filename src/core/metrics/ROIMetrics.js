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

        // Cost and Revenue Metrics
        const totalARR = dataframe_3.TOTAL_ARR || 0;
        const maxARR = dataframe_3.MAX_ARR || 0;
        const paidSeats = dataframe_3.TOTAL_PAID_SEATS || 0;
        const maxPaidSeats = dataframe_3.MAX_PAID_SEATS || 0;

        // Usage Metrics
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const totalGuests = dataframe_3.TOTAL_NUM_GUESTS || 0;
        const totalPages = dataframe_3.TOTAL_NUM_TOTAL_PAGES || 0;
        const alivePages = dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES || 0;

        // Calculate Monthly and Annual Costs
        const monthlyCost = totalARR / 12;
        const annualCost = totalARR;
        const costPerMember = totalMembers > 0 ? monthlyCost / totalMembers : 0;
        const costPerPage = totalPages > 0 ? annualCost / totalPages : 0;

        // Calculate ROI Metrics
        const utilizationRate = paidSeats > 0 ? totalMembers / paidSeats : 0;
        const contentEfficiency = totalPages > 0 ? alivePages / totalPages : 0;
        const revenueGrowthRate = maxARR > 0 ? (totalARR - maxARR) / maxARR : 0;

        // Calculate Savings and Projections
        const savingsMetrics = this.calculateSavingsMetrics({
            totalARR,
            totalMembers,
            utilizationRate,
            contentEfficiency
        });

        const growthScenarios = this.calculateGrowthScenarios({
            currentARR: totalARR,
            totalMembers,
            paidSeats
        });

        return {
            // Cost Metrics
            current_monthly_cost: monthlyCost,
            current_annual_cost: annualCost,
            cost_per_member: costPerMember,
            cost_per_page: costPerPage,
            
            // Usage Metrics
            total_paid_seats: paidSeats,
            seat_utilization: utilizationRate,
            content_efficiency: contentEfficiency,
            revenue_growth: revenueGrowthRate,
            
            // ROI and Savings
            enterprise_roi: savingsMetrics.enterpriseROI,
            enterprise_annual_savings: savingsMetrics.enterpriseSavings,
            ai_productivity_boost: savingsMetrics.aiProductivityBoost,
            projected_savings: savingsMetrics.projectedSavings,
            
            // Growth Scenarios
            growth_scenarios: {
                ten_percent: growthScenarios.tenPercent,
                twenty_percent: growthScenarios.twentyPercent,
                fifty_percent: growthScenarios.fiftyPercent
            },
            
            // Additional Insights
            revenue_per_member: totalMembers > 0 ? totalARR / totalMembers : 0,
            revenue_per_page: totalPages > 0 ? totalARR / totalPages : 0,
            efficiency_score: (utilizationRate + contentEfficiency) / 2
        };
    }

    calculateSavingsMetrics({ totalARR, totalMembers, utilizationRate, contentEfficiency }) {
        // Enterprise ROI calculation
        const baseEnterpriseDiscount = 0.15; // 15% base discount for enterprise
        const utilizationBonus = Math.max(0, utilizationRate - 0.8) * 0.1; // Up to 10% additional discount
        const efficiencyBonus = contentEfficiency * 0.05; // Up to 5% additional discount
        
        const totalDiscount = baseEnterpriseDiscount + utilizationBonus + efficiencyBonus;
        const enterpriseSavings = totalARR * totalDiscount;
        const enterpriseROI = totalDiscount;

        // AI Productivity calculation
        const baseAIBoost = 0.2; // 20% base productivity boost
        const scaleBoost = Math.min(totalMembers / 1000, 0.1); // Up to 10% additional boost based on scale
        const aiProductivityBoost = baseAIBoost + scaleBoost;

        // Projected savings calculation
        const projectedSavings = enterpriseSavings * (1 + aiProductivityBoost);

        return {
            enterpriseROI,
            enterpriseSavings,
            aiProductivityBoost,
            projectedSavings
        };
    }

    calculateGrowthScenarios({ currentARR, totalMembers, paidSeats }) {
        const baseGrowthMultiplier = Math.min(paidSeats / totalMembers, 2);
        
        return {
            tenPercent: currentARR * (1.1 * baseGrowthMultiplier),
            twentyPercent: currentARR * (1.2 * baseGrowthMultiplier),
            fiftyPercent: currentARR * (1.5 * baseGrowthMultiplier)
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
