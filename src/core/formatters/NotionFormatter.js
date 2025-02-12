export class NotionFormatter {
    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: 'Structure & Evolution Metrics',
                metrics: [
                    `Total Pages: ${metrics.total_pages}`,
                    `Max Depth: ${metrics.max_depth}`,
                    `Average Depth: ${this.formatDecimal(metrics.avg_depth)}`,
                    `Deep Pages Count: ${metrics.deep_pages_count}`,
                    `Orphaned Blocks: ${metrics.orphaned_blocks}`,
                    `Collections Count: ${metrics.collections_count}`,
                    `Content Maturity Score: ${this.formatPercentage(metrics.content_maturity_score)}`,
                    `Knowledge Structure Score: ${this.formatPercentage(metrics.knowledge_structure_score)}`,
                    `Workspace Complexity Score: ${this.formatPercentage(metrics.workspace_complexity_score)}`,
                    `Growth Sustainability Index: ${this.formatPercentage(metrics.growth_sustainability_index)}`
                ]
            },
            {
                title: 'Collaboration & Team Metrics',
                metrics: [
                    `Team Adoption Score: ${this.formatPercentage(metrics.team_adoption_score)}`,
                    `Collaboration Density: ${this.formatPercentage(metrics.collaboration_density)}`,
                    `Knowledge Sharing Index: ${this.formatPercentage(metrics.knowledge_sharing_index)}`,
                    `Cross-team Collaboration Score: ${this.formatPercentage(metrics.cross_team_collaboration_score)}`,
                    `Total Members: ${metrics.total_members}`,
                    `Active Members: ${metrics.active_members}`,
                    `Daily Active Users: ${metrics.dailyActiveUsers}`,
                    `Weekly Active Users: ${metrics.weeklyActiveUsers}`,
                    `Monthly Active Users: ${metrics.monthlyActiveUsers}`,
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

    formatDecimal(value) {
        return value ? value.toFixed(2) : '0.00';
    }

    formatPercentage(value) {
        return value ? `${(value).toFixed(1)}%` : '0.0%';
    }

    formatCurrency(value) {
        return value ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
    }
} 