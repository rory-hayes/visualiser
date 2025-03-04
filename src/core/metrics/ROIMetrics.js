import { BaseMetrics } from './BaseMetrics.js';

export class ROIMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        
        // Plan costs and differentials
        this.PLAN_COSTS = {
            plus: 10,
            business: 15,
            enterprise: 20,
            enterprise_ai: 28
        };

        // Time and cost constants
        this.TIME_VALUE_PER_HOUR = 30;
        this.WORKING_DAYS_PER_YEAR = 249;
        this.MINUTES_SAVED_PER_AI_ACTION = 5;
        this.AI_ANNUAL_COST_PER_SEAT = 96; // Difference between Enterprise and Enterprise AI

        // Benchmark data by company size
        this.BENCHMARK_DATA = {
            commercial: {
                avg_arr: 400420,
                avg_ai_usage_percent: 14.82,
                avg_daily_ai_actions: 164.64, // 1152.5 weekly / 7
                avg_lifetime_ai_actions: 14500.5
            },
            midmarket: {
                avg_arr: 158751.62,
                avg_ai_usage_percent: 31.34,
                avg_daily_ai_actions: 69.07, // 483.5 weekly / 7
                avg_lifetime_ai_actions: 5433.25
            },
            enterprise: {
                avg_arr: 256404.57,
                avg_ai_usage_percent: 14.50,
                avg_daily_ai_actions: 26.79, // 187.5 weekly / 7
                avg_lifetime_ai_actions: 1794.25
            }
        };
    }

    calculateDetailedAIROI(dataframe_3, dataframe_5) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const weeklyAiActions = dataframe_5[0]?.AI_ACTIONS_LAST_7_DAYS || 0;
        const lifetimeAiActions = dataframe_5[0]?.LIFETIME_AI_ACTIONS || 0;
        const activeAiUsers = dataframe_5[0]?.MONTHLY_ACTIVE_AI_USERS_PERCENT || 0;

        // Calculate daily metrics
        const dailyAiActions = weeklyAiActions / 7;
        const category = this._determineCategory(totalMembers);
        const benchmarks = this.BENCHMARK_DATA[category];

        // Calculate time savings
        const timeMetrics = this._calculateTimeSavings(dailyAiActions, totalMembers);
        
        // Calculate costs and ROI
        const financialMetrics = this._calculateFinancialMetrics(timeMetrics, totalMembers);
        
        // Calculate benchmark comparisons
        const benchmarkMetrics = this._calculateBenchmarkComparison(
            dailyAiActions,
            activeAiUsers,
            lifetimeAiActions,
            benchmarks
        );

        return {
            inputs: {
                total_members: totalMembers,
                hourly_rate: this.TIME_VALUE_PER_HOUR,
                ai_annual_cost_per_seat: this.AI_ANNUAL_COST_PER_SEAT,
                ai_usage: {
                    daily_ai_requests: dailyAiActions.toFixed(2),
                    minutes_saved_per_request: this.MINUTES_SAVED_PER_AI_ACTION,
                    active_ai_users_percent: activeAiUsers.toFixed(2)
                }
            },
            time_savings: timeMetrics,
            financial_metrics: financialMetrics,
            benchmark_comparison: benchmarkMetrics,
            recommendations: this._generateRecommendations(benchmarkMetrics, category)
        };
    }

    _calculateTimeSavings(dailyAiActions, totalMembers) {
        const hoursPerDay = (dailyAiActions * this.MINUTES_SAVED_PER_AI_ACTION) / 60;
        
        return {
            hours_saved_per_day: hoursPerDay.toFixed(2),
            hours_saved_per_member: (hoursPerDay / totalMembers).toFixed(2),
            annual_hours_saved: (hoursPerDay * this.WORKING_DAYS_PER_YEAR).toFixed(2),
            equation: "Daily AI actions × Minutes saved per action ÷ 60"
        };
    }

    _calculateFinancialMetrics(timeMetrics, totalMembers) {
        const annualValueGenerated = parseFloat(timeMetrics.annual_hours_saved) * this.TIME_VALUE_PER_HOUR;
        const annualAICost = totalMembers * this.AI_ANNUAL_COST_PER_SEAT;
        const netROI = annualValueGenerated - annualAICost;
        const roiPercentage = (netROI / annualAICost) * 100;

        return {
            annual_value_generated: {
                value: annualValueGenerated.toFixed(2),
                equation: "Annual hours saved × Hourly rate"
            },
            annual_ai_cost: {
                value: annualAICost.toFixed(2),
                equation: "Total members × AI annual cost per seat"
            },
            net_roi: {
                value: netROI.toFixed(2),
                equation: "Annual value generated - Annual AI cost"
            },
            roi_percentage: {
                value: roiPercentage.toFixed(2),
                equation: "(Net ROI ÷ Annual AI cost) × 100"
            }
        };
    }

    _calculateBenchmarkComparison(dailyAiActions, activeAiUsers, lifetimeActions, benchmarks) {
        const aiUsagePerformance = (activeAiUsers / benchmarks.avg_ai_usage_percent) * 100;
        const aiActionsPerformance = (dailyAiActions / benchmarks.avg_daily_ai_actions) * 100;
        const lifetimePerformance = (lifetimeActions / benchmarks.avg_lifetime_ai_actions) * 100;

        return {
            current_vs_benchmark: {
                daily_actions: {
                    current: dailyAiActions.toFixed(2),
                    benchmark: benchmarks.avg_daily_ai_actions.toFixed(2),
                    performance: aiActionsPerformance.toFixed(2)
                },
                active_users: {
                    current: activeAiUsers.toFixed(2),
                    benchmark: benchmarks.avg_ai_usage_percent.toFixed(2),
                    performance: aiUsagePerformance.toFixed(2)
                },
                lifetime_actions: {
                    current: lifetimeActions,
                    benchmark: benchmarks.avg_lifetime_ai_actions,
                    performance: lifetimePerformance.toFixed(2)
                }
            },
            potential_improvement: {
                daily_actions: Math.max(0, benchmarks.avg_daily_ai_actions - dailyAiActions).toFixed(2),
                active_users: Math.max(0, benchmarks.avg_ai_usage_percent - activeAiUsers).toFixed(2)
            }
        };
    }

    _generateRecommendations(benchmarkMetrics, category) {
        const recommendations = [];
        const { current_vs_benchmark, potential_improvement } = benchmarkMetrics;

        // Generate specific recommendations based on benchmark comparisons
        if (current_vs_benchmark.active_users.performance < 80) {
            recommendations.push({
                type: "adoption",
                title: "Increase AI Adoption",
                potential: `${potential_improvement.active_users}% additional user adoption possible`,
                impact: `Matching ${category} benchmark could increase ROI by ${((potential_improvement.active_users / 100) * current_vs_benchmark.daily_actions.current * this.MINUTES_SAVED_PER_AI_ACTION * this.TIME_VALUE_PER_HOUR * this.WORKING_DAYS_PER_YEAR).toFixed(2)}`
            });
        }

        if (current_vs_benchmark.daily_actions.performance < 80) {
            recommendations.push({
                type: "usage",
                title: "Increase AI Usage",
                potential: `${potential_improvement.daily_actions} additional daily AI actions possible`,
                impact: `Matching ${category} benchmark could save an additional ${((potential_improvement.daily_actions * this.MINUTES_SAVED_PER_AI_ACTION / 60) * this.WORKING_DAYS_PER_YEAR * this.TIME_VALUE_PER_HOUR).toFixed(2)} annually`
            });
        }

        return recommendations;
    }

    calculateROIMetrics(dataframe_3, dataframe_5) {
        this.validateData([], dataframe_3, dataframe_5);

        const workspace = dataframe_5[0] || {};
        
        // Financial Metrics
        const arr = workspace.ARR || 0;
        const paidSeats = workspace.PAID_SEATS || 0;
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const totalGuests = workspace.NUM_GUESTS || 0;
        
        // Calculate Seat Utilization
        const seatUtilization = this.calculateSeatUtilization(totalMembers, paidSeats);
        
        // Calculate Revenue Metrics
        const revenueMetrics = this.calculateRevenueMetrics(arr, totalMembers, totalGuests);
        
        // Calculate Efficiency Metrics
        const efficiencyMetrics = this.calculateEfficiencyMetrics(workspace);
        
        // Integration ROI
        const integrationROI = this.calculateIntegrationROI(workspace);

        return {
            // Financial Metrics
            annual_recurring_revenue: arr,
            revenue_per_member: revenueMetrics.perMember,
            revenue_per_active_user: revenueMetrics.perActiveUser,
            
            // Seat Metrics
            total_paid_seats: paidSeats,
            seat_utilization_rate: seatUtilization.rate,
            seat_efficiency_score: seatUtilization.efficiencyScore,
            guest_seat_impact: seatUtilization.guestImpact,
            
            // Efficiency Metrics
            workspace_efficiency_score: efficiencyMetrics.workspaceScore,
            content_roi_score: efficiencyMetrics.contentROI,
            collaboration_roi: efficiencyMetrics.collaborationROI,
            
            // Integration Value
            integration_roi_score: integrationROI.score,
            estimated_integration_value: integrationROI.estimatedValue,
            
            // Composite Scores
            overall_roi_score: this.calculateOverallROIScore({
                seatUtilization,
                revenueMetrics,
                efficiencyMetrics,
                integrationROI
            })
        };
    }

    calculateSeatUtilization(totalMembers, paidSeats) {
        if (paidSeats === 0) return { rate: 0, efficiencyScore: 0, guestImpact: 0 };

        const utilizationRate = totalMembers / paidSeats;
        const optimalUtilization = 0.85; // Target 85% utilization as optimal
        const efficiencyScore = Math.min(utilizationRate / optimalUtilization, 1);

        return {
            rate: utilizationRate,
            efficiencyScore: efficiencyScore,
            guestImpact: Math.max(0, 1 - utilizationRate) // Impact of unused seats
        };
    }

    calculateRevenueMetrics(arr, totalMembers, totalGuests) {
        if (totalMembers === 0) return { perMember: 0, perActiveUser: 0 };

        const revenuePerMember = arr / totalMembers;
        const activeUsers = totalMembers + totalGuests;
        const revenuePerActiveUser = activeUsers > 0 ? arr / activeUsers : 0;

        return {
            perMember: revenuePerMember,
            perActiveUser: revenuePerActiveUser
        };
    }

    calculateEfficiencyMetrics(workspace) {
        const totalPages = workspace.NUM_TOTAL_PAGES || 0;
        const alivePages = workspace.NUM_ALIVE_TOTAL_PAGES || 0;
        const totalMembers = workspace.NUM_MEMBERS || 0;

        // Workspace efficiency based on content utilization
        const contentUtilization = totalPages > 0 ? alivePages / totalPages : 0;
        
        // Calculate ROI scores
        const workspaceScore = this.calculateWorkspaceEfficiencyScore(workspace);
        const contentROI = this.calculateContentROIScore(workspace);
        const collaborationROI = this.calculateCollaborationROIScore(workspace);

        return {
            workspaceScore,
            contentROI,
            collaborationROI
        };
    }

    calculateWorkspaceEfficiencyScore(workspace) {
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const totalPages = workspace.NUM_TOTAL_PAGES || 0;
        const alivePages = workspace.NUM_ALIVE_TOTAL_PAGES || 0;

        if (totalMembers === 0 || totalPages === 0) return 0;

        const contentPerMember = totalPages / totalMembers;
        const contentUtilization = alivePages / totalPages;

        return Math.min(
            (contentPerMember / 100) * contentUtilization, // Normalize to assume 100 pages per member is optimal
            1
        );
    }

    calculateContentROIScore(workspace) {
        const totalPages = workspace.NUM_TOTAL_PAGES || 0;
        const alivePages = workspace.NUM_ALIVE_TOTAL_PAGES || 0;
        const publicPages = workspace.NUM_PUBLIC_PAGES || 0;

        if (totalPages === 0) return 0;

        const contentUtilization = alivePages / totalPages;
        const publicContentRatio = publicPages / totalPages;

        return (contentUtilization * 0.7 + publicContentRatio * 0.3);
    }

    calculateCollaborationROIScore(workspace) {
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const permissionGroups = workspace.NUM_PERMISSION_GROUPS || 0;
        const teamspaces = workspace.NUM_TEAMSPACES || 0;

        if (totalMembers === 0) return 0;

        const collaborationDensity = permissionGroups / totalMembers;
        const teamspaceUtilization = teamspaces / totalMembers;

        return Math.min(
            (collaborationDensity * 0.6 + teamspaceUtilization * 0.4),
            1
        );
    }

    calculateIntegrationROI(workspace) {
        const totalIntegrations = workspace.NUM_INTEGRATIONS || 0;
        const totalMembers = workspace.NUM_MEMBERS || 0;
        const arr = workspace.ARR || 0;

        if (totalMembers === 0 || arr === 0) return { score: 0, estimatedValue: 0 };

        // Estimate integration value based on industry standards
        const avgIntegrationValue = arr * 0.1; // Assume integrations save 10% of ARR
        const estimatedValue = totalIntegrations * avgIntegrationValue;

        // Calculate ROI score
        const integrationDensity = totalIntegrations / totalMembers;
        const score = Math.min(integrationDensity / 0.2, 1); // Normalize assuming 1 integration per 5 members is optimal

        return {
            score,
            estimatedValue
        };
    }

    calculateOverallROIScore({ seatUtilization, revenueMetrics, efficiencyMetrics, integrationROI }) {
        const weights = {
            seatEfficiency: 0.3,
            workspaceEfficiency: 0.3,
            contentROI: 0.2,
            integrationROI: 0.2
        };

        return (
            seatUtilization.efficiencyScore * weights.seatEfficiency +
            efficiencyMetrics.workspaceScore * weights.workspaceEfficiency +
            efficiencyMetrics.contentROI * weights.contentROI +
            integrationROI.score * weights.integrationROI
        );
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
            ai_actions_performance: (aiActions / benchmarks.avg_daily_ai_actions) * 100,
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
                    avg_daily_ai_actions: benchmarks.avg_daily_ai_actions,
                    avg_lifetime_ai_actions: benchmarks.avg_lifetime_ai_actions
                },
                performance_vs_benchmark: {
                    ai_usage_percent: benchmarkComparison.ai_usage_performance.toFixed(2),
                    daily_actions: benchmarkComparison.ai_actions_performance.toFixed(2),
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

    formatPerformanceMetric(value, threshold = 0.7) {
        const percentage = Number(value);
        if (isNaN(percentage)) return '0% ⚪';
        
        // Add visual indicators
        if (percentage >= 0.9) return `${this.formatPercentage(percentage)} 🟢`;
        if (percentage >= threshold) return `${this.formatPercentage(percentage)} 🟡`;
        return `${this.formatPercentage(percentage)} 🔴`;
    }
}
