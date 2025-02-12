export class NotionFormatter {
    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: 'Structure & Evolution Metrics',
                metrics: [
                    `Total Pages: ${metrics.totalPages}`,
                    `Max Depth: ${metrics.maxDepth}`,
                    `Average Depth: ${this.formatDecimal(metrics.avgDepth)}`,
                    `Deep Pages Count: ${metrics.deepPagesCount}`,
                    `Orphaned Blocks: ${metrics.orphanedBlocks}`,
                    `Collections Count: ${metrics.collectionsCount}`,
                    `Content Diversity Score: ${this.formatPercentage(metrics.contentDiversityScore)}`,
                    `Structure Quality Index: ${this.formatPercentage(metrics.structureQualityIndex)}`
                ]
            },
            {
                title: 'Usage & Team Metrics',
                metrics: [
                    `Total Members: ${metrics.totalMembers}`,
                    `Active Members: ${metrics.activeMembers}`,
                    `Daily Active Users: ${metrics.dailyActiveUsers}`,
                    `Weekly Active Users: ${metrics.weeklyActiveUsers}`,
                    `Monthly Active Users: ${metrics.monthlyActiveUsers}`,
                    `Team Adoption Score: ${this.formatPercentage(metrics.teamAdoptionScore)}`,
                    `Engagement Score: ${this.formatPercentage(metrics.engagementScore)}`
                ]
            },
            {
                title: 'Growth & Projections',
                metrics: [
                    `Monthly Member Growth Rate: ${this.formatPercentage(metrics.monthlyMemberGrowthRate)}`,
                    `Monthly Content Growth Rate: ${this.formatPercentage(metrics.monthlyContentGrowthRate)}`,
                    `Expected Members Next Year: ${Math.round(metrics.expectedMembersNextYear)}`,
                    `Growth Consistency: ${this.formatPercentage(metrics.growthConsistency)}`,
                    `Scaling Readiness Score: ${this.formatPercentage(metrics.scalingReadinessScore)}`
                ]
            },
            {
                title: 'ROI & Cost Analysis',
                metrics: [
                    `Current Plan Cost: ${this.formatCurrency(metrics.currentPlanCost)}/month`,
                    `Enterprise Plan ROI: ${this.formatPercentage(metrics.enterprisePlanROI)}`,
                    `Enterprise Plan Annual Savings: ${this.formatCurrency(metrics.enterprisePlanSavings)}`,
                    `Enterprise + AI ROI: ${this.formatPercentage(metrics.enterpriseAIROI)}`,
                    `Enterprise + AI Annual Savings: ${this.formatCurrency(metrics.enterpriseAISavings)}`,
                    `Projected Time Savings: ${this.formatDecimal(metrics.projectedTimeSavings.hoursPerMember)} hours/member/month`,
                    `Automation Potential: ${this.formatPercentage(metrics.automationPotential.score)}`
                ]
            }
        ];

        return this.createBlocksFromSections(sections);
    }

    createBlocksFromSections(sections) {
        const blocks = [];

        // Add title
        blocks.push(this.createHeading('Workspace Analysis Report', 1));

        // Add sections
        sections.forEach(section => {
            blocks.push(this.createHeading(section.title, 2));
            blocks.push(...this.createBulletedList(section.metrics));
            blocks.push(this.createDivider());
        });

        return blocks;
    }

    createHeading(text, level) {
        return {
            object: 'block',
            type: `heading_${level}`,
            [`heading_${level}`]: {
                rich_text: [{
                    type: 'text',
                    text: { content: text }
                }]
            }
        };
    }

    createBulletedList(items) {
        return items.map(item => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{
                    type: 'text',
                    text: { content: item }
                }]
            }
        }));
    }

    createDivider() {
        return {
            object: 'block',
            type: 'divider',
            divider: {}
        };
    }

    formatDecimal(value, decimals = 2) {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toFixed(decimals) : value.toString();
    }

    formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined) return 'N/A';
        return `${this.formatDecimal(value * 100, decimals)}%`;
    }

    formatCurrency(value) {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
} 