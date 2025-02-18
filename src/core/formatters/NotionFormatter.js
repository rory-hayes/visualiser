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
                    `Max Depth: ${metrics.max_depth || 0} | Average Depth: ${this.formatDecimal(metrics.avg_depth || 0)}`,
                    `Deep Pages Count: ${metrics.deep_pages_count || 0} | Root Pages: ${metrics.root_pages || 0}`,
                    `Orphaned Blocks: ${metrics.orphaned_blocks || 0} | Total Table Rows: ${metrics.total_table_rows || 0}`,
                    
                    // Navigation & Structure Quality
                    `Navigation Depth Score: ${this.formatPercentage(metrics.nav_depth_score || 0)} | Navigation Complexity: ${this.formatPercentage(metrics.nav_complexity || 0)}`,
                    `Scatter Index: ${this.formatPercentage(metrics.scatter_index || 0)} | Percentage Unlinked: ${this.formatPercentage(metrics.percentage_unlinked || 0)}`,
                    `Bottleneck Count: ${metrics.bottleneck_count || 0} | Duplicate Count: ${metrics.duplicate_count || 0}`,
                    `Unfindable Pages: ${metrics.unfindable_pages || 0} | Structured Pages Ratio: ${this.formatPercentage(metrics.structured_pages_ratio || 0)}`,
                    
                    // Content Quality
                    `Content Diversity Score: ${this.formatPercentage(metrics.content_diversity_score || 0)} | Structure Health Score: ${this.formatPercentage(metrics.structure_health_score || 0)}`,
                    `Content Organization Score: ${this.formatPercentage(metrics.content_organization_score || 0)} | Structure Quality Index: ${this.formatPercentage(metrics.structure_quality_index || 0)}`,
                    
                    // Evolution Metrics
                    `Content Maturity Score: ${this.formatPercentage(metrics.content_maturity_score || 0)} | Knowledge Structure Score: ${this.formatPercentage(metrics.knowledge_structure_score || 0)}`,
                    `Workspace Complexity Score: ${this.formatPercentage(metrics.workspace_complexity_score || 0)} | Growth Sustainability Index: ${this.formatPercentage(metrics.growth_sustainability_index || 0)}`,
                    `Content Evolution Rate: ${this.formatPercentage(metrics.content_evolution_rate || 0)} | Structure Evolution Score: ${this.formatPercentage(metrics.structure_evolution_score || 0)}`,
                    `Adaptation Score: ${this.formatPercentage(metrics.adaptation_score || 0)} | Change Velocity: ${this.formatPercentage(metrics.change_velocity || 0)}`,
                    
                    // Block and Page Health
                    `Total Blocks: ${metrics.total_blocks || 0} | Alive Blocks: ${metrics.alive_blocks || 0}`,
                    `Total Pages (All): ${metrics.total_pages_all || 0} | Alive Pages: ${metrics.alive_pages_all || 0}`,
                    `Public Pages: ${metrics.public_pages || 0} | Private Pages: ${metrics.private_pages || 0}`,
                    
                    // Content Health
                    `Content Health Ratio: ${this.formatPercentage(metrics.content_health_ratio || 0)} | Page Health Ratio: ${this.formatPercentage(metrics.page_health_ratio || 0)}`,
                    `Structured Content Ratio: ${this.formatPercentage(metrics.structured_content_ratio || 0)} | Public Content Ratio: ${this.formatPercentage(metrics.public_content_ratio || 0)}`,
                    `Collection Density: ${this.formatPercentage(metrics.collection_density || 0)} | Database Complexity Score: ${this.formatPercentage(metrics.database_complexity_score || 0)}`
                ]
            },
            {
                title: 'Collaboration & Team Metrics',
                metrics: [
                    // Team & Member Metrics
                    `Total Members: ${metrics.totalMembers || 0} | Active Members: ${metrics.activeMembers || 0}`,
                    `Total Guests: ${metrics.totalGuests || 0} | Total Teamspaces: ${metrics.totalTeamspaces || 0}`,
                    `Average Teamspace Members: ${this.formatDecimal(metrics.averageTeamspaceMembers || 0)} | Permission Groups: ${metrics.permission_groups || 0}`,
                    
                    // Activity Metrics
                    `Daily Active Users: ${metrics.dailyActiveUsers || 0} | Weekly Active Users: ${metrics.weeklyActiveUsers || 0}`,
                    `Monthly Active Users: ${metrics.monthlyActiveUsers || 0} | Team Adoption Score: ${this.formatPercentage(metrics.teamAdoptionScore || 0)}`,
                    
                    // Collaboration Metrics
                    `Collaboration Density: ${this.formatPercentage(metrics.collaborationDensity || 0)} | Knowledge Sharing Index: ${this.formatPercentage(metrics.knowledgeSharingIndex || 0)}`,
                    `Cross-team Collaboration Score: ${this.formatPercentage(metrics.crossTeamCollaborationScore || 0)} | Engagement Score: ${this.formatPercentage(metrics.engagementScore || 0)}`,
                    `Collaboration Rate: ${this.formatPercentage(metrics.collaborationRate || 0)} | Collaboration Efficiency: ${this.formatPercentage(metrics.collaborationEfficiency || 0)}`,
                    `Team Interaction Score: ${this.formatPercentage(metrics.teamInteractionScore || 0)} | Collaboration Factor: ${this.formatPercentage(metrics.collaborationFactor || 0)}`,
                    `Usage Factor: ${this.formatPercentage(metrics.usageFactor || 0)} | Total Integrations: ${metrics.totalIntegrations || 0}`
                ]
            },
            {
                title: 'Growth & Projections',
                metrics: [
                    // Growth Rates
                    `Monthly Member Growth Rate: ${this.formatPercentage(metrics.monthly_member_growth_rate || 0)} | Monthly Guest Growth Rate: ${this.formatPercentage(metrics.monthly_guest_growth_rate || 0)}`,
                    `Total Member Growth: ${this.formatPercentage(metrics.total_member_growth || 0)} | Monthly Content Growth Rate: ${this.formatPercentage(metrics.monthly_content_growth_rate || 0)}`,
                    `Alive Content Growth Rate: ${this.formatPercentage(metrics.alive_content_growth_rate || 0)} | Content Retention Rate: ${this.formatPercentage(metrics.content_retention_rate || 0)}`,
                    
                    // Structure Growth
                    `Teamspace Growth Rate: ${this.formatPercentage(metrics.teamspace_growth_rate || 0)} | Permission Group Growth: ${this.formatPercentage(metrics.permission_group_growth || 0)}`,
                    
                    // Projections
                    `Expected Members Next Year: ${Math.round(metrics.expected_members_next_year || 0)} | Expected Pages Next Year: ${metrics.expected_pages_next_year || 0}`,
                    `Expected Teamspaces Next Year: ${metrics.expected_teamspaces_next_year || 0} | Growth Consistency: ${this.formatPercentage(metrics.growth_consistency || 0)}`,
                    
                    // Growth Quality
                    `Growth Sustainability: ${this.formatPercentage(metrics.growth_sustainability || 0)} | Scaling Readiness Score: ${this.formatPercentage(metrics.scaling_readiness_score || 0)}`,
                    `Growth Efficiency: ${this.formatPercentage(metrics.growth_efficiency || 0)} | Growth Balance Score: ${this.formatPercentage(metrics.growth_balance_score || 0)}`,
                    
                    // Growth Scenarios
                    `10% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.ten_percent || 0)}/year | 20% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.twenty_percent || 0)}/year`,
                    `50% Growth Scenario: ${this.formatCurrency(metrics.growth_scenarios?.fifty_percent || 0)}/year | Member to Content Ratio: ${this.formatDecimal(metrics.member_to_content_ratio || 0)}`,
                    `Teamspace Density: ${this.formatDecimal(metrics.teamspace_density || 0)}`
                ]
            },
            {
                title: 'ROI & Cost Analysis',
                metrics: [
                    // Current Costs
                    `Current Plan Cost: ${this.formatCurrency(metrics.current_monthly_cost || 0)}/month | Annual Cost: ${this.formatCurrency(metrics.current_annual_cost || 0)}`,
                    
                    // Enterprise Benefits
                    `Enterprise Plan ROI: ${this.formatPercentage(metrics.enterprise_roi || 0)} | Enterprise Plan Annual Savings: ${this.formatCurrency(metrics.enterprise_annual_savings || 0)}`,
                    
                    // AI Benefits
                    `Enterprise + AI ROI: ${this.formatPercentage(metrics.enterprise_ai_roi || 0)} | Enterprise + AI Annual Savings: ${this.formatCurrency(metrics.enterprise_ai_savings || 0)}`,
                    `AI Productivity Boost: ${this.formatPercentage(metrics.ai_productivity_boost || 0)} | Productivity Gain: ${this.formatPercentage(metrics.productivity_gain || 0)}`,
                    
                    // Time & Automation
                    `Projected Time Savings: ${this.formatDecimal(metrics.projected_time_savings?.hours_per_member || 0)} hours/member/month | Total Hours Saved: ${this.formatDecimal(metrics.projected_time_savings?.total_hours || 0)} hours/month`,
                    `Monetary Value of Time Saved: ${this.formatCurrency(metrics.projected_time_savings?.monetary_value || 0)}/month | Automation Potential Score: ${this.formatPercentage(metrics.automation_potential?.score || 0)}`,
                    `Potential Automation Savings: ${this.formatCurrency(metrics.automation_potential?.potential_savings || 0)}/year`,
                    
                    // Usage Metrics
                    `Total Paid Seats: ${metrics.total_paid_seats || 0} | Seat Utilization: ${this.formatPercentage(metrics.seat_utilization || 0)}`,
                    `Content Efficiency: ${this.formatPercentage(metrics.content_efficiency || 0)} | Revenue Growth: ${this.formatPercentage(metrics.revenue_growth || 0)}`,
                    
                    // ROI and Savings
                    `Enterprise ROI: ${this.formatPercentage(metrics.enterprise_roi || 0)} | Enterprise Annual Savings: ${this.formatCurrency(metrics.enterprise_annual_savings || 0)}`,
                    `Projected Savings: ${this.formatCurrency(metrics.projected_savings || 0)} | Revenue per Member: ${this.formatCurrency(metrics.revenue_per_member || 0)}`,
                    `Revenue per Page: ${this.formatCurrency(metrics.revenue_per_page || 0)} | Efficiency Score: ${this.formatPercentage(metrics.efficiency_score || 0)}`
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