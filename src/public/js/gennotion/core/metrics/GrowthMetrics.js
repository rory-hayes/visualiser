export class GrowthMetrics {
    constructor(calculator) {
        this.calculator = calculator;
    }

    calculateGrowthMetrics(dataframe_3, dataframe_2, dataframe_5) {
        if (!dataframe_3 || !dataframe_2?.length || !dataframe_5?.length) {
            console.warn('No growth data available');
            return {};
        }

        const now = Date.now();
        const thirtyDaysAgo = now - (30 * this.calculator.MILLISECONDS_PER_DAY);
        const sixtyDaysAgo = now - (60 * this.calculator.MILLISECONDS_PER_DAY);
        const ninetyDaysAgo = now - (90 * this.calculator.MILLISECONDS_PER_DAY);

        // Count nodes created in different time periods
        const nodesLast30Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > thirtyDaysAgo
        ).length;

        const nodesLast60Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > sixtyDaysAgo
        ).length;

        const nodesLast90Days = dataframe_2.filter(node => 
            parseInt(node.CREATED_TIME) > ninetyDaysAgo
        ).length;

        // Calculate monthly growth rates
        const monthly_content_growth_rate = (nodesLast30Days / dataframe_2.length) * 100;
        
        // Calculate 60-day vs 30-day growth trend
        const growth_trend_60d = ((nodesLast60Days - nodesLast30Days) / nodesLast30Days) * 100;
        
        // Calculate 90-day vs 60-day growth trend
        const growth_trend_90d = ((nodesLast90Days - nodesLast60Days) / nodesLast60Days) * 100;

        // User metrics
        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        
        // Estimate member growth based on content growth (assuming correlation)
        const monthly_member_growth_rate = Math.min(monthly_content_growth_rate * 0.5, 10); // Cap at 10%
        
        const growth_capacity = 
            (monthly_member_growth_rate * 0.6) + (monthly_content_growth_rate * 0.4);
        
        const expected_members_in_next_year = 
            total_members * Math.pow(1 + (monthly_member_growth_rate/100), 12);

        // Calculate daily creation averages
        const avg_daily_creation_30d = nodesLast30Days / 30;
        const avg_daily_creation_60d = nodesLast60Days / 60;
        const avg_daily_creation_90d = nodesLast90Days / 90;

        return {
            monthly_member_growth_rate,
            monthly_content_growth_rate,
            growth_capacity,
            expected_members_in_next_year,
            nodes_created_last_30_days: nodesLast30Days,
            nodes_created_last_60_days: nodesLast60Days,
            nodes_created_last_90_days: nodesLast90Days,
            avg_daily_creation_30d,
            avg_daily_creation_60d,
            avg_daily_creation_90d,
            growth_trend_60d,
            growth_trend_90d
        };
    }

    calculateTrendMetrics(dataframe_2) {
        if (!dataframe_2?.length) return {};

        const now = Date.now();
        const creationTimes = dataframe_2.map(row => parseInt(row.CREATED_TIME));
        const workspaceAge = this.calculator.calculateWorkspaceAge(dataframe_2);

        // Monthly buckets for content creation
        const monthlyContent = {};
        creationTimes.forEach(time => {
            const monthKey = Math.floor((now - time) / this.calculator.MILLISECONDS_PER_MONTH);
            monthlyContent[monthKey] = (monthlyContent[monthKey] || 0) + 1;
        });

        // Calculate growth rates
        const monthlyGrowthRates = [];
        Object.keys(monthlyContent).sort().forEach((month, index, months) => {
            if (index > 0) {
                const currentMonth = monthlyContent[month];
                const previousMonth = monthlyContent[months[index - 1]];
                const growthRate = ((currentMonth - previousMonth) / previousMonth) * 100;
                monthlyGrowthRates.push(growthRate);
            }
        });

        // Recent periods analysis
        const last30Days = creationTimes.filter(time => (now - time) <= 30 * this.calculator.MILLISECONDS_PER_DAY).length;
        const last60Days = creationTimes.filter(time => (now - time) <= 60 * this.calculator.MILLISECONDS_PER_DAY).length;
        const last90Days = creationTimes.filter(time => (now - time) <= 90 * this.calculator.MILLISECONDS_PER_DAY).length;

        return {
            monthly_growth_rates: monthlyGrowthRates,
            blocks_created_last_month: monthlyContent[0] || 0,
            blocks_created_last_year: workspaceAge >= 12 ? 
                Object.values(monthlyContent).slice(0, 12).reduce((sum, count) => sum + count, 0) : 
                "workspace currently too young",
            content_growth_trend: monthlyGrowthRates.slice(-3),
            growth_acceleration: this.calculateGrowthAcceleration(monthlyGrowthRates),
            creation_velocity: this.calculateCreationVelocity(monthlyContent),
            content_created_30d: last30Days,
            content_created_60d: last60Days,
            content_created_90d: last90Days,
            avg_daily_creation_30d: last30Days / 30,
            avg_daily_creation_60d: last60Days / 60,
            avg_daily_creation_90d: last90Days / 90,
            workspace_maturity: this.determineWorkspaceMaturity(workspaceAge, monthlyGrowthRates)
        };
    }

    calculateGrowthAcceleration(monthlyGrowthRates) {
        if (monthlyGrowthRates.length < 2) return 0;
        
        const recentRates = monthlyGrowthRates.slice(-2);
        return recentRates[1] - recentRates[0];
    }

    calculateCreationVelocity(monthlyContent) {
        const recentMonths = Object.values(monthlyContent).slice(0, 3);
        return recentMonths.reduce((sum, count) => sum + count, 0) / recentMonths.length;
    }

    determineWorkspaceMaturity(workspaceAge, growthRates) {
        if (workspaceAge < 3) return 'New';
        if (workspaceAge < 6) return 'Growing';
        if (workspaceAge < 12) return 'Established';
        return 'Mature';
    }

    calculatePredictiveMetrics(dataframe_2, dataframe_3) {
        const growthPatterns = this.analyzeGrowthPatterns(dataframe_2);
        const usagePatterns = this.analyzeUsagePatterns(dataframe_2, dataframe_3);

        return {
            growth_trajectory: this.calculateGrowthTrajectory(growthPatterns),
            scaling_readiness_score: this.calculateScalingReadiness(dataframe_2, dataframe_3),
            bottleneck_prediction: this.predictBottlenecks(usagePatterns),
            growth_potential_score: this.calculateGrowthPotential(dataframe_2, dataframe_3),
            optimization_opportunities: this.identifyOptimizationOpportunities(dataframe_2, dataframe_3)
        };
    }

    analyzeGrowthPatterns(dataframe_2) {
        const now = Date.now();
        const monthlyGrowth = {};
        
        dataframe_2.forEach(row => {
            const month = Math.floor((now - parseInt(row.CREATED_TIME)) / this.calculator.MILLISECONDS_PER_MONTH);
            monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
        });

        return {
            monthly_growth: monthlyGrowth,
            growth_rate: Object.values(monthlyGrowth)[0] / 
                        (Object.values(monthlyGrowth)[1] || Object.values(monthlyGrowth)[0]),
            consistency: this.calculateGrowthConsistency(Object.values(monthlyGrowth))
        };
    }

    calculateGrowthConsistency(monthlyValues) {
        if (monthlyValues.length < 2) return 100;
        
        const variations = monthlyValues.slice(1).map((value, index) => 
            Math.abs(value - monthlyValues[index]) / monthlyValues[index]
        );
        
        return Math.max(0, 100 - (this.average(variations) * 100));
    }

    analyzeUsagePatterns(dataframe_2, dataframe_3) {
        const contentPerMember = dataframe_3.NUM_BLOCKS / dataframe_3.TOTAL_NUM_MEMBERS;
        const collectionUsage = dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES;
        
        return {
            content_per_member: contentPerMember,
            collection_usage: collectionUsage,
            usage_score: Math.min(100, (contentPerMember / 10) * 50 + (collectionUsage * 50))
        };
    }

    calculateGrowthTrajectory(growthPatterns) {
        return growthPatterns.growth_rate * growthPatterns.consistency;
    }

    calculateScalingReadiness(dataframe_2, dataframe_3) {
        const structureScore = this.calculator.structureMetrics.calculateStructureQualityIndex(
            this.calculator.structureMetrics.analyzeStructureQuality(dataframe_2)
        );
        const automationScore = this.calculator.usageMetrics.calculateAutomationEffectiveness(dataframe_3);
        const organizationScore = this.calculator.contentMetrics.calculateOrganizationScore(dataframe_2);
        
        return (structureScore * 0.4 + automationScore * 0.3 + organizationScore * 0.3);
    }

    predictBottlenecks(usagePatterns) {
        const bottlenecks = [];
        
        if (usagePatterns.content_per_member > 100) {
            bottlenecks.push("High content per member ratio - consider restructuring");
        }
        if (usagePatterns.collection_usage < 0.1) {
            bottlenecks.push("Low collection usage - consider implementing more databases");
        }
        
        return bottlenecks.length ? bottlenecks : ["No significant bottlenecks detected"];
    }

    calculateGrowthPotential(dataframe_2, dataframe_3) {
        const currentUtilization = this.analyzeUsagePatterns(dataframe_2, dataframe_3).usage_score;
        const scalingReadiness = this.calculateScalingReadiness(dataframe_2, dataframe_3);
        
        return (currentUtilization * 0.3 + scalingReadiness * 0.7);
    }

    identifyOptimizationOpportunities(dataframe_2, dataframe_3) {
        const opportunities = [];
        
        if (dataframe_3.NUM_COLLECTIONS / dataframe_3.TOTAL_NUM_TOTAL_PAGES < 0.1) {
            opportunities.push("Increase database usage for better content organization");
        }
        if (dataframe_3.TOTAL_NUM_INTEGRATIONS < this.calculator.RECOMMENDED_INTEGRATIONS) {
            opportunities.push("Add more integrations to improve workflow automation");
        }
        if (this.calculator.structureMetrics.countOrphanedPages(dataframe_2) > dataframe_2.length * 0.1) {
            opportunities.push("Reduce number of orphaned pages");
        }
        
        return opportunities.length ? opportunities : ["No significant optimization opportunities identified"];
    }

    // Helper function for calculating averages
    average(array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    }
} 