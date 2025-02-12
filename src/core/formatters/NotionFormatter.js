export class NotionFormatter {
    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: 'Structure & Evolution Metrics',
                metrics: [
                    // Basic Structure Metrics
                    `Total Pages: ${metrics.total_pages || metrics.totalPages || 0}`,
                    `Max Depth: ${metrics.max_depth || metrics.maxDepth || 0}`,
                    `Average Depth: ${this.formatDecimal(metrics.avg_depth || metrics.avgDepth)}`,
                    `Deep Pages Count: ${metrics.deep_pages_count || metrics.deepPagesCount || 0}`,
                    `Root Pages: ${metrics.root_pages || metrics.rootPages || 0}`,
                    `Orphaned Blocks: ${metrics.orphaned_blocks || metrics.orphanedBlocks || 0}`,
                    `Collections Count: ${metrics.collections_count || metrics.collectionsCount || 0}`,
                    `Collection Views: ${metrics.collection_views || metrics.collectionViews || 0}`,
                    
                    // Navigation & Structure Quality
                    `Navigation Depth Score: ${this.formatPercentage(metrics.nav_depth_score || metrics.navDepthScore)}`,
                    `Navigation Complexity: ${this.formatPercentage(metrics.nav_complexity || metrics.navComplexity)}`,
                    `Scatter Index: ${this.formatPercentage(metrics.scatter_index || metrics.scatterIndex)}`,
                    `Percentage Unlinked: ${this.formatPercentage(metrics.percentage_unlinked || metrics.percentageUnlinked)}`,
                    `Bottleneck Count: ${metrics.bottleneck_count || metrics.bottleneckCount || 0}`,
                    `Duplicate Count: ${metrics.duplicate_count || metrics.duplicateCount || 0}`,
                    `Unfindable Pages: ${metrics.unfindable_pages || metrics.unfindablePages || 0}`,
                    
                    // Evolution Metrics
                    `Content Maturity Score: ${this.formatPercentage(metrics.content_maturity_score || metrics.contentMaturityScore)}`,
                    `Knowledge Structure Score: ${this.formatPercentage(metrics.knowledge_structure_score || metrics.knowledgeStructureScore)}`,
                    `Workspace Complexity Score: ${this.formatPercentage(metrics.workspace_complexity_score || metrics.workspaceComplexityScore)}`,
                    `Growth Sustainability Index: ${this.formatPercentage(metrics.growth_sustainability_index || metrics.growthSustainabilityIndex)}`
                ]
            },
            {
                title: 'Collaboration & Team Metrics',
                metrics: [
                    // Team & Member Metrics
                    `Total Members: ${metrics.total_members || metrics.totalMembers || 0}`,
                    `Active Members: ${metrics.active_members || metrics.activeMembers || 0}`,
                    `Total Guests: ${metrics.total_guests || metrics.totalGuests || 0}`,
                    `Total Teamspaces: ${metrics.total_teamspaces || metrics.totalTeamspaces || 0}`,
                    `Average Teamspace Members: ${this.formatDecimal(metrics.average_teamspace_members || metrics.averageTeamspaceMembers)}`,
                    
                    // Activity Metrics
                    `Daily Active Users: ${metrics.daily_active_users || metrics.dailyActiveUsers || 0}`,
                    `Weekly Active Users: ${metrics.weekly_active_users || metrics.weeklyActiveUsers || 0}`,
                    `Monthly Active Users: ${metrics.monthly_active_users || metrics.monthlyActiveUsers || 0}`,
                    
                    // Collaboration Metrics
                    `Team Adoption Score: ${this.formatPercentage(metrics.team_adoption_score || metrics.teamAdoptionScore)}`,
                    `Collaboration Density: ${this.formatPercentage(metrics.collaboration_density || metrics.collaborationDensity)}`,
                    `Knowledge Sharing Index: ${this.formatPercentage(metrics.knowledge_sharing_index || metrics.knowledgeSharingIndex)}`,
                    `Cross-team Collaboration Score: ${this.formatPercentage(metrics.cross_team_collaboration_score || metrics.crossTeamCollaborationScore)}`,
                    `Engagement Score: ${this.formatPercentage(metrics.engagement_score || metrics.engagementScore)}`,
                    `Collaboration Rate: ${this.formatPercentage(metrics.collaboration_rate || metrics.collaborationRate)}`
                ]
            },
            {
                title: 'Growth & Projections',
                metrics: [
                    // Growth Rates
                    `Monthly Member Growth Rate: ${this.formatPercentage(metrics.monthly_member_growth_rate || metrics.monthlyMemberGrowthRate)}`,
                    `Monthly Content Growth Rate: ${this.formatPercentage(metrics.monthly_content_growth_rate || metrics.monthlyContentGrowthRate)}`,
                    
                    // Projections
                    `Expected Members Next Year: ${Math.round(metrics.expected_members_next_year || metrics.expectedMembersNextYear || 0)}`,
                    `Growth Consistency: ${this.formatPercentage(metrics.growth_consistency || metrics.growthConsistency)}`,
                    `Growth Trajectory: ${this.formatPercentage(metrics.growth_trajectory || metrics.growthTrajectory)}`,
                    
                    // Growth Quality
                    `Scaling Readiness Score: ${this.formatPercentage(metrics.scaling_readiness_score || metrics.scalingReadinessScore)}`,
                    `Growth Potential Score: ${this.formatPercentage(metrics.growth_potential_score || metrics.growthPotentialScore)}`,
                    `Structure Readiness: ${this.formatPercentage(metrics.structure_readiness || metrics.structureReadiness)}`,
                    `Team Readiness: ${this.formatPercentage(metrics.team_readiness || metrics.teamReadiness)}`,
                    
                    // Growth Scenarios
                    `10% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.tenPercent || metrics.growthScenarios?.tenPercent || 0)}/year`,
                    `20% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.twentyPercent || metrics.growthScenarios?.twentyPercent || 0)}/year`,
                    `50% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.fiftyPercent || metrics.growthScenarios?.fiftyPercent || 0)}/year`
                ]
            },
            {
                title: 'ROI & Cost Analysis',
                metrics: [
                    // Current Costs
                    `Current Plan Cost: ${this.formatCurrency(metrics.current_plan_cost || metrics.currentPlanCost)}/month`,
                    `Annual Cost: ${this.formatCurrency(metrics.annual_cost || metrics.annualCost)}`,
                    
                    // Enterprise Benefits
                    `Enterprise Plan ROI: ${this.formatPercentage(metrics.enterprise_plan_roi || metrics.enterprisePlanROI)}`,
                    `Enterprise Plan Annual Savings: ${this.formatCurrency(metrics.enterprise_plan_savings || metrics.enterprisePlanSavings)}`,
                    
                    // AI Benefits
                    `Enterprise + AI ROI: ${this.formatPercentage(metrics.enterprise_ai_roi || metrics.enterpriseAIROI)}`,
                    `Enterprise + AI Annual Savings: ${this.formatCurrency(metrics.enterprise_ai_savings || metrics.enterpriseAISavings)}`,
                    
                    // Time & Automation
                    `Projected Time Savings: ${this.formatDecimal(metrics.projected_time_savings?.hours_per_member || metrics.projectedTimeSavings?.hoursPerMember)} hours/member/month`,
                    `Total Hours Saved: ${this.formatDecimal(metrics.projected_time_savings?.total_hours || metrics.projectedTimeSavings?.totalHours)} hours/month`,
                    `Monetary Value of Time Saved: ${this.formatCurrency(metrics.projected_time_savings?.monetary_value || metrics.projectedTimeSavings?.monetaryValue)}/month`,
                    `Automation Potential Score: ${this.formatPercentage(metrics.automation_potential?.score || metrics.automationPotential?.score)}`,
                    `Potential Automation Savings: ${this.formatCurrency(metrics.automation_potential?.potential_savings || metrics.automationPotential?.potentialSavings)}/year`
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