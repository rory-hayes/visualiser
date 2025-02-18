import { BaseMetrics } from './BaseMetrics.js';

export class GrowthMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.GROWTH_PERIOD_MONTHS = 12;
        this.PROJECTION_MONTHS = 12;
    }

    calculateGrowthMetrics(dataframe_2, dataframe_3, dataframe_5) {
        this.validateData(dataframe_2, dataframe_3, dataframe_5);

        // Member Growth Metrics
        const currentMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const maxMembers = dataframe_3.MAX_NUM_MEMBERS || 0;
        const currentGuests = dataframe_3.TOTAL_NUM_GUESTS || 0;
        const maxGuests = dataframe_3.MAX_NUM_GUESTS || 0;

        // Content Growth Metrics
        const currentPages = dataframe_3.TOTAL_NUM_TOTAL_PAGES || 0;
        const maxPages = dataframe_3.MAX_NUM_TOTAL_PAGES || 0;
        const currentAlivePages = dataframe_3.TOTAL_NUM_ALIVE_TOTAL_PAGES || 0;
        const maxAlivePages = dataframe_3.MAX_NUM_ALIVE_TOTAL_PAGES || 0;

        // Team Structure Growth
        const currentTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        const maxTeamspaces = dataframe_3.MAX_NUM_TEAMSPACES || 0;
        const currentPermissionGroups = dataframe_3.TOTAL_NUM_PERMISSION_GROUPS || 0;
        const maxPermissionGroups = dataframe_3.MAX_NUM_PERMISSION_GROUPS || 0;

        // Calculate Growth Rates
        const memberGrowthRate = this.calculateGrowthRate(currentMembers, maxMembers);
        const guestGrowthRate = this.calculateGrowthRate(currentGuests, maxGuests);
        const pageGrowthRate = this.calculateGrowthRate(currentPages, maxPages);
        const alivePageGrowthRate = this.calculateGrowthRate(currentAlivePages, maxAlivePages);
        const teamspaceGrowthRate = this.calculateGrowthRate(currentTeamspaces, maxTeamspaces);

        // Calculate Projections
        const projections = this.calculateProjections({
            currentMembers,
            memberGrowthRate,
            currentPages,
            pageGrowthRate,
            currentTeamspaces,
            teamspaceGrowthRate
        });

        // Calculate Growth Quality Metrics
        const growthQuality = this.calculateGrowthQuality({
            alivePageGrowthRate,
            pageGrowthRate,
            teamspaceGrowthRate,
            memberGrowthRate
        });

        return {
            // Member Growth
            monthly_member_growth_rate: this.formatPercentage(memberGrowthRate),
            monthly_guest_growth_rate: this.formatPercentage(guestGrowthRate),
            total_member_growth: this.formatPercentage((currentMembers - maxMembers) / maxMembers),
            
            // Content Growth
            monthly_content_growth_rate: this.formatPercentage(pageGrowthRate),
            alive_content_growth_rate: this.formatPercentage(alivePageGrowthRate),
            content_retention_rate: this.formatPercentage(currentAlivePages / currentPages),
            
            // Structure Growth
            teamspace_growth_rate: this.formatPercentage(teamspaceGrowthRate),
            permission_group_growth: this.formatPercentage(
                this.calculateGrowthRate(currentPermissionGroups, maxPermissionGroups)
            ),
            
            // Projections
            expected_members_next_year: projections.expectedMembers,
            expected_pages_next_year: projections.expectedPages,
            expected_teamspaces_next_year: projections.expectedTeamspaces,
            
            // Growth Quality Metrics
            growth_consistency: this.formatPercentage(growthQuality.consistency),
            growth_sustainability: this.formatPercentage(growthQuality.sustainability),
            scaling_readiness_score: this.formatPercentage(growthQuality.scalingReadiness),
            growth_efficiency: this.formatPercentage(growthQuality.efficiency),
            
            // Additional Insights
            member_to_content_ratio: this.formatDecimal(currentPages / currentMembers),
            teamspace_density: this.formatDecimal(currentTeamspaces / currentMembers),
            growth_balance_score: this.formatPercentage(
                this.calculateGrowthBalance(memberGrowthRate, pageGrowthRate, teamspaceGrowthRate)
            )
        };
    }

    calculateGrowthRate(current, max) {
        if (!max || max === 0) return 0;
        return (current - max) / max;
    }

    calculateProjections({ currentMembers, memberGrowthRate, currentPages, pageGrowthRate, currentTeamspaces, teamspaceGrowthRate }) {
        const monthsInYear = 12;
        const compoundGrowth = (base, rate) => base * Math.pow(1 + rate, monthsInYear);

        return {
            expectedMembers: Math.ceil(compoundGrowth(currentMembers, memberGrowthRate)),
            expectedPages: Math.ceil(compoundGrowth(currentPages, pageGrowthRate)),
            expectedTeamspaces: Math.ceil(compoundGrowth(currentTeamspaces, teamspaceGrowthRate))
        };
    }

    calculateGrowthQuality({ alivePageGrowthRate, pageGrowthRate, teamspaceGrowthRate, memberGrowthRate }) {
        // Consistency: How well aligned are different growth metrics
        const growthRates = [alivePageGrowthRate, pageGrowthRate, teamspaceGrowthRate, memberGrowthRate];
        const avgGrowth = this.average(growthRates);
        const consistency = 1 - this.calculateVariance(growthRates, avgGrowth);

        // Sustainability: How well is content being maintained as it grows
        const sustainability = alivePageGrowthRate / pageGrowthRate;

        // Scaling Readiness: How well the structure supports growth
        const scalingReadiness = (teamspaceGrowthRate / memberGrowthRate + sustainability) / 2;

        // Efficiency: How effectively the workspace is growing
        const efficiency = Math.min(1, (alivePageGrowthRate + teamspaceGrowthRate) / (2 * memberGrowthRate));

        return {
            consistency: Math.max(0, Math.min(1, consistency)),
            sustainability: Math.max(0, Math.min(1, sustainability)),
            scalingReadiness: Math.max(0, Math.min(1, scalingReadiness)),
            efficiency: Math.max(0, Math.min(1, efficiency))
        };
    }

    calculateVariance(values, mean) {
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        return this.average(squareDiffs);
    }

    calculateGrowthBalance(memberGrowthRate, pageGrowthRate, teamspaceGrowthRate) {
        const rates = [memberGrowthRate, pageGrowthRate, teamspaceGrowthRate];
        const maxRate = Math.max(...rates);
        const minRate = Math.min(...rates);

        if (maxRate <= 0) return 0;
        return 1 - ((maxRate - minRate) / maxRate);
    }

    analyzeGrowthPatterns(dataframe_2) {
        const monthlyContent = new Map();
        const now = new Date();

        dataframe_2.forEach(item => {
            const createdDate = new Date(item.CREATED_TIME);
            const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth() + 1}`;
            monthlyContent.set(monthKey, (monthlyContent.get(monthKey) || 0) + 1);
        });

        const monthlyValues = Array.from(monthlyContent.values());
        const recentMonths = monthlyValues.slice(-this.GROWTH_PERIOD_MONTHS);

        return {
            monthlyValues: recentMonths,
            trend: this.calculateCreationTrend(recentMonths),
            acceleration: this.calculateGrowthAcceleration(recentMonths)
        };
    }

    calculateMemberGrowth(dataframe_3) {
        const currentMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const membersLastMonth = dataframe_3.MEMBERS_LAST_MONTH || currentMembers;
        
        const monthlyRate = membersLastMonth > 0 ? 
            (currentMembers - membersLastMonth) / membersLastMonth : 
            0;

        return {
            monthlyRate,
            currentMembers,
            membersLastMonth
        };
    }

    calculateContentGrowthRate(dataframe_2) {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentContent = dataframe_2.filter(item => 
            new Date(item.CREATED_TIME) >= monthAgo
        ).length;

        const totalContent = dataframe_2.length;
        const monthlyRate = totalContent > 0 ? recentContent / totalContent : 0;

        return {
            monthlyRate,
            recentContent,
            totalContent
        };
    }

    calculateGrowthConsistency(monthlyValues) {
        if (monthlyValues.length < 2) return 1;

        const variations = monthlyValues.slice(1).map((value, index) => 
            Math.abs(value - monthlyValues[index]) / monthlyValues[index]
        );

        const avgVariation = this.average(variations);
        return Math.max(0, 1 - avgVariation);
    }

    calculateGrowthTrajectory(growthPatterns) {
        const { trend, acceleration } = growthPatterns;
        
        // Normalize trend and acceleration to -1 to 1 range
        const normalizedTrend = Math.tanh(trend);
        const normalizedAcceleration = Math.tanh(acceleration);

        // Weight trend more heavily than acceleration
        return (normalizedTrend * 0.7) + (normalizedAcceleration * 0.3);
    }

    calculateScalingReadiness(dataframe_2, dataframe_3) {
        const structureScore = this.assessStructureReadiness(dataframe_2);
        const teamScore = this.assessTeamReadiness(dataframe_3);
        
        return {
            score: (structureScore + teamScore) / 2,
            structureScore,
            teamScore
        };
    }

    calculateGrowthPotential(dataframe_2, dataframe_3) {
        const currentSize = dataframe_2.length;
        const currentMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const contentPerMember = currentMembers > 0 ? currentSize / currentMembers : 0;
        
        // Assume optimal content per member ratio is between 50-200
        const contentOptimization = Math.min(1, contentPerMember / 100);
        
        // Consider team size and current growth rates
        const teamCapacity = Math.min(1, currentMembers / 50); // Assume 50 members is a good benchmark
        
        return (contentOptimization + teamCapacity) / 2;
    }

    predictBottlenecks(growthPatterns) {
        const bottlenecks = [];
        const { trend, acceleration } = growthPatterns;

        if (trend > 0.5 && acceleration < 0) {
            bottlenecks.push('Slowing growth rate');
        }

        if (trend > 0.7) {
            bottlenecks.push('Potential scaling challenges');
        }

        if (acceleration < -0.3) {
            bottlenecks.push('Decreasing engagement');
        }

        return bottlenecks;
    }

    predictMemberGrowth(dataframe_3, monthlyGrowthRate) {
        const currentMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        return currentMembers * Math.pow(1 + monthlyGrowthRate, this.PROJECTION_MONTHS);
    }

    calculateGrowthAcceleration(monthlyValues) {
        if (monthlyValues.length < 3) return 0;

        const growthRates = monthlyValues.slice(1).map((value, index) => 
            monthlyValues[index] > 0 ? (value - monthlyValues[index]) / monthlyValues[index] : 0
        );

        const recentGrowth = this.average(growthRates.slice(-3));
        const previousGrowth = this.average(growthRates.slice(0, -3));

        return previousGrowth !== 0 ? (recentGrowth - previousGrowth) / Math.abs(previousGrowth) : 0;
    }

    calculateCreationTrend(monthlyValues) {
        if (monthlyValues.length < 2) return 0;

        const xMean = (monthlyValues.length - 1) / 2;
        const yMean = this.average(monthlyValues);

        let numerator = 0;
        let denominator = 0;

        monthlyValues.forEach((y, x) => {
            const xDiff = x - xMean;
            const yDiff = y - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        });

        return denominator !== 0 ? numerator / denominator : 0;
    }

    assessStructureReadiness(dataframe_2) {
        const depthDistribution = dataframe_2.reduce((acc, page) => {
            const depth = page.DEPTH || 0;
            acc[depth] = (acc[depth] || 0) + 1;
            return acc;
        }, {});

        const totalPages = dataframe_2.length;
        const avgDepth = Object.entries(depthDistribution).reduce(
            (acc, [depth, count]) => acc + (depth * count), 0
        ) / totalPages;

        // Penalize both too shallow and too deep structures
        const depthScore = Math.max(0, 1 - Math.abs(avgDepth - 3) / 3);

        // Consider the distribution of content types
        const typeDistribution = dataframe_2.reduce((acc, page) => {
            acc[page.TYPE] = (acc[page.TYPE] || 0) + 1;
            return acc;
        }, {});

        const diversityScore = Object.values(typeDistribution).length / totalPages;

        return (depthScore + diversityScore) / 2;
    }

    assessTeamReadiness(dataframe_3) {
        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const totalTeamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 0;
        
        // Ideal ratio is 5-10 members per teamspace
        const teamspaceRatio = totalTeamspaces > 0 ? totalMembers / totalTeamspaces : 0;
        const teamspaceScore = Math.max(0, 1 - Math.abs(teamspaceRatio - 7.5) / 7.5);

        // Consider collaboration metrics
        const collaborationScore = Math.min(1, (dataframe_3.TOTAL_COLLABORATIONS || 0) / (totalMembers * 5));

        return (teamspaceScore + collaborationScore) / 2;
    }
}
