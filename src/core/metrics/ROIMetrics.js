import { BaseMetrics } from './BaseMetrics.js';

export class ROIMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.PLAN_COSTS = {
            plus: 10,
            business: 15,
            enterprise: 20,
            enterprise_ai: 28
        };

        this.BENCHMARK_DATA = {
            commercial: {
                avg_arr: 400420,
                avg_ai_usage_percent: 14.82,
                avg_weekly_ai_actions: 1152.5,
                avg_lifetime_ai_actions: 14500.5
            },
            midmarket: {
                avg_arr: 158751.62,
                avg_ai_usage_percent: 31.34,
                avg_weekly_ai_actions: 483.5,
                avg_lifetime_ai_actions: 5433.25
            },
            enterprise: {
                avg_arr: 256404.57,
                avg_ai_usage_percent: 14.50,
                avg_weekly_ai_actions: 187.5,
                avg_lifetime_ai_actions: 1794.25
            }
        };

        this.TIME_VALUE_PER_HOUR = 30; // Average hourly cost
        this.HOURS_PER_MONTH = 160;
        this.MINUTES_SAVED_PER_AI_ACTION = 5;
        this.WORKING_DAYS_PER_YEAR = 249;
    }

    calculateROIMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        // Cost and Revenue Metrics
        const totalARR = dataframe_5[0]?.ARR || 0;
        const maxARR = dataframe_5[0]?.MAX_ARR || 0;
        const paidSeats = dataframe_5[0]?.PAID_SEATS || 0;
        const maxPaidSeats = dataframe_5[0]?.MAX_PAID_SEATS || 0;

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

        // Calculate Time and Automation Metrics
        const timeSavings = this.calculateProjectedTimeSavings(dataframe_3, dataframe_5);
        const automationPotential = this.calculateAutomationPotential(dataframe_3);
        const productivityGain = this.calculateProductivityGain(dataframe_3, dataframe_5);
        const aiBoost = this.calculateAIProductivityBoost(dataframe_3);

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
            growth_scenarios: growthScenarios,
            
            // Time and Automation
            projected_time_savings: timeSavings,
            automation_potential: automationPotential,
            productivity_gain: productivityGain,
            
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
        const monthlyCost = totalMembers * this.PLAN_COSTS.plus;
        
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
            
            const currentCost = this.calculatePlanCost(projectedMembers, 'plus');
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

    calculateAIROIMetrics(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const aiActions = dataframe_5[0]?.AI_ACTIONS_LAST_7_DAYS || 0;
        const lifetimeAiActions = dataframe_5[0]?.LIFETIME_AI_ACTIONS || 0;
        const activeAiUsers = dataframe_5[0]?.MONTHLY_ACTIVE_AI_USERS_PERCENT || 0;
        
        // Determine company size category
        const category = this._determineCategory(totalMembers);
        const benchmarks = this.BENCHMARK_DATA[category];

        // Calculate daily AI metrics
        const dailyAiActions = aiActions / 7;
        const hoursPerDay = (dailyAiActions * this.MINUTES_SAVED_PER_AI_ACTION) / 60;
        
        // Calculate annual value and costs
        const annualValueGenerated = hoursPerDay * this.WORKING_DAYS_PER_YEAR * this.TIME_VALUE_PER_HOUR;
        const annualAICost = totalMembers * (this.PLAN_COSTS.enterprise_ai - this.PLAN_COSTS.enterprise) * 12;

        // Calculate ROI
        const netROI = annualValueGenerated - annualAICost;
        const roiPercentage = (netROI / annualAICost) * 100;

        // Benchmark comparisons
        const benchmarkComparison = {
            ai_usage_performance: (activeAiUsers / benchmarks.avg_ai_usage_percent) * 100,
            ai_actions_performance: (aiActions / benchmarks.avg_weekly_ai_actions) * 100,
            lifetime_actions_performance: (lifetimeAiActions / benchmarks.avg_lifetime_ai_actions) * 100
        };

        return {
            inputs: {
                total_members: totalMembers,
                hourly_rate: this.TIME_VALUE_PER_HOUR,
                ai_cost_per_seat_annual: (this.PLAN_COSTS.enterprise_ai - this.PLAN_COSTS.enterprise) * 12,
                company_size_category: category
            },
            ai_usage: {
                daily_ai_requests: dailyAiActions.toFixed(2),
                minutes_saved_per_request: this.MINUTES_SAVED_PER_AI_ACTION,
                active_ai_users_percent: activeAiUsers.toFixed(2)
            },
            calculations: {
                hours_saved_per_day: hoursPerDay.toFixed(2),
                annual_value_generated: annualValueGenerated.toFixed(2),
                annual_ai_cost: annualAICost.toFixed(2),
                net_roi: netROI.toFixed(2),
                roi_percentage: roiPercentage.toFixed(2)
            },
            benchmark_comparison: {
                category_averages: {
                    avg_ai_usage_percent: benchmarks.avg_ai_usage_percent,
                    avg_weekly_ai_actions: benchmarks.avg_weekly_ai_actions,
                    avg_lifetime_ai_actions: benchmarks.avg_lifetime_ai_actions
                },
                performance_vs_benchmark: {
                    ai_usage_percent: benchmarkComparison.ai_usage_performance.toFixed(2),
                    weekly_actions: benchmarkComparison.ai_actions_performance.toFixed(2),
                    lifetime_actions: benchmarkComparison.lifetime_actions_performance.toFixed(2)
                }
            },
            insights: this._generateAIInsights(benchmarkComparison, category)
        };
    }

    _determineCategory(totalMembers) {
        if (totalMembers >= 2000) return 'enterprise';
        if (totalMembers >= 300) return 'midmarket';
        return 'commercial';
    }

    _generateAIInsights(comparison, category) {
        const insights = [];
        
        // Usage adoption insights
        if (comparison.ai_usage_performance > 120) {
            insights.push(`Your AI adoption rate would be ${Math.floor(comparison.ai_usage_performance - 100)}% higher than the average ${category} workspace`);
        } else if (comparison.ai_usage_performance < 80) {
            insights.push(`There's potential to increase AI adoption by ${Math.floor(100 - comparison.ai_usage_performance)}% to match ${category} benchmarks`);
        }

        // Activity insights
        if (comparison.ai_actions_performance > 120) {
            insights.push(`Your team is utilizing AI features ${Math.floor(comparison.ai_actions_performance - 100)}% more actively than similar workspaces`);
        }

        // Maturity insights
        if (comparison.lifetime_actions_performance > 150) {
            insights.push(`Your workspace shows mature AI adoption with ${Math.floor(comparison.lifetime_actions_performance - 100)}% more lifetime actions than the benchmark`);
        }

        return insights;
    }
}
