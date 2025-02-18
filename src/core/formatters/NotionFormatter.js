export class NotionFormatter {
    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: 'Workspace Visualization',
                metrics: []
            },
            {
                title: 'Structure & Evolution Metrics',
                metrics: [
                    // Basic Structure Metrics
                    `Total Pages: ${metrics.total_pages || 0} | Collections Count: ${metrics.collections_count || 0}`,
                    `Collection Views: ${metrics.collection_views || 0} | Collection View Pages: ${metrics.collection_view_pages || 0}`,
                    `Max Depth: ${metrics.max_depth || metrics.maxDepth || 0} | Average Depth: ${this.formatDecimal(metrics.avg_depth || metrics.avgDepth)}`,
                    `Deep Pages Count: ${metrics.deep_pages_count || metrics.deepPagesCount || 0} | Root Pages: ${metrics.root_pages || metrics.rootPages || 0}`,
                    `Orphaned Blocks: ${metrics.orphaned_blocks || metrics.orphanedBlocks || 0} | Total Table Rows: ${metrics.total_table_rows || 0}`,
                    
                    // Navigation & Structure Quality
                    `Navigation Depth Score: ${this.formatPercentage(metrics.nav_depth_score || metrics.navDepthScore)} | Navigation Complexity: ${this.formatPercentage(metrics.nav_complexity || metrics.navComplexity)}`,
                    `Scatter Index: ${this.formatPercentage(metrics.scatter_index || metrics.scatterIndex)} | Percentage Unlinked: ${this.formatPercentage(metrics.percentage_unlinked || metrics.percentageUnlinked)}`,
                    `Bottleneck Count: ${metrics.bottleneck_count || metrics.bottleneckCount || 0} | Duplicate Count: ${metrics.duplicate_count || metrics.duplicateCount || 0}`,
                    `Unfindable Pages: ${metrics.unfindable_pages || metrics.unfindablePages || 0} | Structured Pages Ratio: ${this.formatPercentage(metrics.structured_pages_ratio || metrics.structuredPagesRatio)}`,
                    `Content Diversity Score: ${this.formatPercentage(metrics.content_diversity_score || metrics.contentDiversityScore)} | Structure Health Score: ${this.formatPercentage(metrics.structure_health_score || metrics.structureHealthScore)}`,
                    `Content Organization Score: ${this.formatPercentage(metrics.content_organization_score || metrics.contentOrganizationScore)} | Structure Quality Index: ${this.formatPercentage(metrics.structure_quality_index || metrics.structureQualityIndex)}`,
                    
                    // Evolution Metrics
                    `Content Maturity Score: ${this.formatPercentage(metrics.content_maturity_score || metrics.contentMaturityScore)} | Knowledge Structure Score: ${this.formatPercentage(metrics.knowledge_structure_score || metrics.knowledgeStructureScore)}`,
                    `Workspace Complexity Score: ${this.formatPercentage(metrics.workspace_complexity_score || metrics.workspaceComplexityScore)} | Growth Sustainability Index: ${this.formatPercentage(metrics.growth_sustainability_index || metrics.growthSustainabilityIndex)}`,
                    `Content Evolution Rate: ${this.formatPercentage(metrics.content_evolution_rate || metrics.contentEvolutionRate)} | Structure Evolution Score: ${this.formatPercentage(metrics.structure_evolution_score || metrics.structureEvolutionScore)}`,
                    `Adaptation Score: ${this.formatPercentage(metrics.adaptation_score || metrics.adaptationScore)} | Change Velocity: ${this.formatPercentage(metrics.change_velocity || metrics.changeVelocity)}`,
                    
                    // Block and Page Health
                    `Total Blocks: ${metrics.total_blocks || 0} | Alive Blocks: ${metrics.alive_blocks || 0}`,
                    `Total Pages (All): ${metrics.total_pages_all || 0} | Alive Pages: ${metrics.alive_pages_all || 0}`,
                    `Public Pages: ${metrics.public_pages || 0} | Private Pages: ${metrics.private_pages || 0}`,
                    
                    // Content Health
                    `Content Health Ratio: ${this.formatPercentage(metrics.content_health_ratio)} | Page Health Ratio: ${this.formatPercentage(metrics.page_health_ratio)}`,
                    `Structured Content Ratio: ${this.formatPercentage(metrics.structured_content_ratio)} | Public Content Ratio: ${this.formatPercentage(metrics.public_content_ratio)}`,
                    `Collection Density: ${this.formatPercentage(metrics.collection_density)} | Database Complexity Score: ${this.formatPercentage(metrics.database_complexity_score)}`
                ]
            },
            {
                title: 'Collaboration & Team Metrics',
                metrics: [
                    // Team & Member Metrics
                    `Total Members: ${metrics.total_members || 0} | Active Members: ${metrics.active_members || metrics.activeMembers || 0}`,
                    `Total Guests: ${metrics.total_guests || 0} | Total Teamspaces: ${metrics.total_teamspaces || 0}`,
                    `Average Teamspace Members: ${this.formatDecimal(metrics.average_teamspace_members || metrics.averageTeamspaceMembers)} | Permission Groups: ${metrics.permission_groups || 0}`,
                    
                    // Activity Metrics
                    `Daily Active Users: ${metrics.daily_active_users || metrics.dailyActiveUsers || 0} | Weekly Active Users: ${metrics.weekly_active_users || metrics.weeklyActiveUsers || 0}`,
                    `Monthly Active Users: ${metrics.monthly_active_users || metrics.monthlyActiveUsers || 0} | Team Adoption Score: ${this.formatPercentage(metrics.team_adoption_score || metrics.teamAdoptionScore)}`,
                    
                    // Teamspace Structure
                    `Open Teamspaces: ${metrics.open_teamspaces || 0} | Closed Teamspaces: ${metrics.closed_teamspaces || 0}`,
                    `Private Teamspaces: ${metrics.private_teamspaces || 0} | Total Bots: ${metrics.total_bots || 0}`,
                    
                    // Collaboration Metrics
                    `Collaboration Density: ${this.formatPercentage(metrics.collaboration_density || metrics.collaborationDensity)} | Knowledge Sharing Index: ${this.formatPercentage(metrics.knowledge_sharing_index || metrics.knowledgeSharingIndex)}`,
                    `Cross-team Collaboration Score: ${this.formatPercentage(metrics.cross_team_collaboration_score || metrics.crossTeamCollaborationScore)} | Engagement Score: ${this.formatPercentage(metrics.engagement_score || metrics.engagementScore)}`,
                    `Collaboration Rate: ${this.formatPercentage(metrics.collaboration_rate || metrics.collaborationRate)} | Collaboration Efficiency: ${this.formatPercentage(metrics.collaboration_efficiency || metrics.collaborationEfficiency)}`,
                    `Team Interaction Score: ${this.formatPercentage(metrics.team_interaction_score || metrics.teamInteractionScore)} | Collaboration Factor: ${this.formatPercentage(metrics.collaboration_factor || metrics.collaborationFactor)}`,
                    
                    // Team Composition & Permissions
                    `Usage Factor: ${this.formatPercentage(metrics.usage_factor || metrics.usageFactor)} | Total Integrations: ${metrics.total_integrations || 0}`,
                    `Permission Complexity: ${this.formatPercentage(metrics.permission_complexity)} | Guest Ratio: ${this.formatPercentage(metrics.guest_ratio)}`,
                    `Automation Level: ${this.formatPercentage(metrics.automation_level)}`
                ]
            },
            {
                title: 'Growth & Projections',
                metrics: [
                    // Growth Rates
                    `Monthly Member Growth Rate: ${this.formatPercentage(metrics.monthly_member_growth_rate || metrics.monthlyMemberGrowthRate)} | Monthly Guest Growth Rate: ${this.formatPercentage(metrics.monthly_guest_growth_rate || metrics.monthlyGuestGrowthRate)}`,
                    `Total Member Growth: ${this.formatPercentage(metrics.total_member_growth || metrics.totalMemberGrowth)} | Monthly Content Growth Rate: ${this.formatPercentage(metrics.monthly_content_growth_rate || metrics.monthlyContentGrowthRate)}`,
                    `Alive Content Growth Rate: ${this.formatPercentage(metrics.alive_content_growth_rate || metrics.aliveContentGrowthRate)} | Content Retention Rate: ${this.formatPercentage(metrics.content_retention_rate || metrics.contentRetentionRate)}`,
                    
                    // Structure Growth
                    `Teamspace Growth Rate: ${this.formatPercentage(metrics.teamspace_growth_rate || metrics.teamspaceGrowthRate)} | Permission Group Growth: ${this.formatPercentage(metrics.permission_group_growth || metrics.permissionGroupGrowth)}`,
                    
                    // Projections
                    `Expected Members Next Year: ${Math.round(metrics.expected_members_next_year || metrics.expectedMembersNextYear || 0)} | Expected Pages Next Year: ${metrics.expected_pages_next_year || metrics.expectedPagesNextYear || 0}`,
                    `Expected Teamspaces Next Year: ${metrics.expected_teamspaces_next_year || metrics.expectedTeamspacesNextYear || 0} | Growth Consistency: ${this.formatPercentage(metrics.growth_consistency || metrics.growthConsistency)}`,
                    
                    // Growth Quality
                    `Growth Sustainability: ${this.formatPercentage(metrics.growth_sustainability || metrics.growthSustainability)} | Scaling Readiness Score: ${this.formatPercentage(metrics.scaling_readiness_score || metrics.scalingReadinessScore)}`,
                    `Growth Efficiency: ${this.formatPercentage(metrics.growth_efficiency || metrics.growthEfficiency)} | Growth Balance Score: ${this.formatPercentage(metrics.growth_balance_score || metrics.growthBalanceScore)}`,
                    
                    // Growth Scenarios
                    `10% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.ten_percent || 0)}/year | 20% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.twenty_percent || 0)}/year`,
                    `50% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.fifty_percent || 0)}/year | Member to Content Ratio: ${this.formatDecimal(metrics.member_to_content_ratio || metrics.memberToContentRatio)}`,
                    `Teamspace Density: ${this.formatDecimal(metrics.teamspace_density || metrics.teamspaceDensity)}`
                ]
            },
            {
                title: 'ROI & Cost Analysis',
                metrics: [
                    // Current Costs
                    `Current Plan Cost: ${this.formatCurrency(metrics.current_plan_cost || metrics.currentPlanCost)}/month | Annual Cost: ${this.formatCurrency(metrics.annual_cost || metrics.annualCost)}`,
                    
                    // Enterprise Benefits
                    `Enterprise Plan ROI: ${this.formatPercentage(metrics.enterprise_plan_roi || metrics.enterprisePlanROI)} | Enterprise Plan Annual Savings: ${this.formatCurrency(metrics.enterprise_plan_savings || metrics.enterprisePlanSavings)}`,
                    
                    // AI Benefits
                    `Enterprise + AI ROI: ${this.formatPercentage(metrics.enterprise_ai_roi || metrics.enterpriseAIROI)} | Enterprise + AI Annual Savings: ${this.formatCurrency(metrics.enterprise_ai_savings || metrics.enterpriseAISavings)}`,
                    `AI Productivity Boost: ${this.formatPercentage(metrics.ai_productivity_boost || metrics.aiProductivityBoost)} | Productivity Gain: ${this.formatPercentage(metrics.productivity_gain || metrics.productivityGain)}`,
                    
                    // Time & Automation
                    `Projected Time Savings: ${this.formatDecimal(metrics.projected_time_savings?.hours_per_member || metrics.projectedTimeSavings?.hoursPerMember)} hours/member/month | Total Hours Saved: ${this.formatDecimal(metrics.projected_time_savings?.total_hours || metrics.projectedTimeSavings?.totalHours)} hours/month`,
                    `Monetary Value of Time Saved: ${this.formatCurrency(metrics.projected_time_savings?.monetary_value || metrics.projectedTimeSavings?.monetaryValue)}/month | Automation Potential Score: ${this.formatPercentage(metrics.automation_potential?.score || metrics.automationPotential?.score)}`,
                    `Potential Automation Savings: ${this.formatCurrency(metrics.automation_potential?.potential_savings || metrics.automationPotential?.potentialSavings)}/year`,
                    
                    // Usage Metrics
                    `Total Paid Seats: ${metrics.total_paid_seats || 0} | Seat Utilization: ${this.formatPercentage(metrics.seat_utilization || metrics.seatUtilization)}`,
                    `Content Efficiency: ${this.formatPercentage(metrics.content_efficiency || metrics.contentEfficiency)} | Revenue Growth: ${this.formatPercentage(metrics.revenue_growth || metrics.revenueGrowth)}`,
                    
                    // ROI and Savings
                    `Enterprise ROI: ${this.formatPercentage(metrics.enterprise_roi || metrics.enterpriseROI)} | Enterprise Annual Savings: ${this.formatCurrency(metrics.enterprise_annual_savings || metrics.enterpriseAnnualSavings)}`,
                    `Projected Savings: ${this.formatCurrency(metrics.projected_savings || metrics.projectedSavings)} | Revenue per Member: ${this.formatCurrency(metrics.revenue_per_member || metrics.revenuePerMember)}`,
                    `Revenue per Page: ${this.formatCurrency(metrics.revenue_per_page || metrics.revenuePerPage)} | Efficiency Score: ${this.formatPercentage(metrics.efficiency_score || metrics.efficiencyScore)}`
                ]
            }
        ];

        const blocks = [];

        // Add title
        blocks.push(this.createHeading('Workspace Analysis Report', 1));

        // Add visualization image if available
        if (metrics.visualizationUrl) {
            blocks.push(
                this.createHeading('Workspace Structure Visualization', 2),
                this.createImage(metrics.visualizationUrl)
            );
        }

        // Add sections
        sections.forEach(section => {
            if (section.metrics.length > 0) {
                blocks.push(this.createHeading(section.title, 2));
                blocks.push(...this.createBulletedList(section.metrics));
                blocks.push(this.createDivider());
            }
        });

        return blocks;
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
        const num = Number(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    }

    formatPercentage(value) {
        const num = Number(value);
        return isNaN(num) ? '0.0%' : `${(num * 100).toFixed(1)}%`;
    }

    formatCurrency(value) {
        const num = Number(value);
        return isNaN(num) ? '$0.00' : new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    createImage(url) {
        return {
            object: 'block',
            type: 'image',
            image: {
                type: 'external',
                external: {
                    url: url
                }
            }
        };
    }
} 