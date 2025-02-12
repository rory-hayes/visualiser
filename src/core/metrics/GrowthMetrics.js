import { BaseMetrics } from './BaseMetrics.js';

export class GrowthMetrics extends BaseMetrics {
    constructor(notionClient = null) {
        super(notionClient);
        this.GROWTH_PERIOD_MONTHS = 12;
        this.PROJECTION_MONTHS = 12;
    }

    calculateGrowthMetrics(dataframe_2, dataframe_3, dataframe_5) {
        this.validateData(dataframe_2, dataframe_3, dataframe_5);

        const growthPatterns = this.analyzeGrowthPatterns(dataframe_2);
        const memberGrowth = this.calculateMemberGrowth(dataframe_3);
        const contentGrowth = this.calculateContentGrowthRate(dataframe_2);
        const scalingReadiness = this.calculateScalingReadiness(dataframe_2, dataframe_3);

        return {
            monthlyMemberGrowthRate: memberGrowth.monthlyRate,
            monthlyContentGrowthRate: contentGrowth.monthlyRate,
            expectedMembersNextYear: this.predictMemberGrowth(dataframe_3, memberGrowth.monthlyRate),
            growthConsistency: this.calculateGrowthConsistency(growthPatterns.monthlyValues),
            growthTrajectory: this.calculateGrowthTrajectory(growthPatterns),
            scalingReadinessScore: scalingReadiness.score,
            growthPotentialScore: this.calculateGrowthPotential(dataframe_2, dataframe_3),
            predictedBottlenecks: this.predictBottlenecks(growthPatterns)
        };
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
