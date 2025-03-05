export class NotionFormatter {
    // Add emoji mapping
    METRIC_EMOJIS = {
        cost: '💰',
        time: '⏱️',
        users: '👥',
        growth: '📈',
        ai: '🤖',
        roi: '💎',
        pages: '📄',
        efficiency: '⚡',
        collaboration: '🤝',
        automation: '⚙️',
        structure: '🏗️',
        navigation: '🗺️',
        content: '📑',
        health: '❤️',
        database: '🗃️',
        team: '👥',
        activity: '📊',
        projection: '🎯',
        financial: '💵'
    };

    PERFORMANCE_INDICATORS = {
        HIGH: '🟢',    // >90%
        MEDIUM: '🟡',  // 70-90%
        LOW: '🔴',     // <70%
        NONE: '⚪'     // No data
    };

    createMetricsBlocks(metrics) {
        const sections = [
            {
                title: '📊 Executive Summary',
                explanation: 'A high-level overview of your workspace\'s key performance indicators and health metrics.',
                metrics: [
                    this.createMetricWithIndicator('Workspace Health Score', metrics.workspace_health_score),
                    this.createMetricWithIndicator('Overall Efficiency', metrics.efficiency_score),
                    this.createMetricWithIndicator('ROI Score', metrics.enterprise_roi),
                    `Total Members: ${metrics.totalMembers || 0} | Active Members: ${metrics.activeMembers || 0}`,
                    `Total Pages: ${metrics.total_pages || 0} | Active Pages: ${metrics.alive_pages_all || 0}`
                ]
            },
            {
                title: '🏗️ Structure & Evolution Metrics',
                explanation: 'Analysis of your workspace\'s organization, depth, and structural health.',
                metrics: [
                    this.createMetricWithIndicator('Structure Health Score', metrics.structure_health_score),
                    this.createMetricWithIndicator('Navigation Depth Score', metrics.nav_depth_score),
                    this.createMetricWithIndicator('Content Organization', metrics.content_organization_score),
                    `Max Depth: ${metrics.max_depth || 0} | Average Depth: ${this.formatDecimal(metrics.avg_depth || 0)}`,
                    `Deep Pages: ${metrics.deep_pages_count || 0} | Root Pages: ${metrics.root_pages || 0}`,
                    `Orphaned Content: ${metrics.orphaned_blocks || 0} | Duplicate Content: ${metrics.duplicate_count || 0}`
                ]
            },
            {
                title: '🤝 Collaboration & Team Dynamics',
                explanation: 'Insights into how your team collaborates and utilizes the workspace.',
                metrics: [
                    this.createMetricWithIndicator('Team Adoption Score', metrics.teamAdoptionScore),
                    this.createMetricWithIndicator('Collaboration Score', metrics.collaborationDensity),
                    this.createMetricWithIndicator('Knowledge Sharing', metrics.knowledgeSharingIndex),
                    `Daily Active Users: ${metrics.dailyActiveUsers || 0} | Weekly Active: ${metrics.weeklyActiveUsers || 0}`,
                    `Cross-team Score: ${this.formatPercentage(metrics.crossTeamCollaborationScore || 0)}`,
                    `Total Integrations: ${metrics.totalIntegrations || 0} | Permission Groups: ${metrics.permission_groups || 0}`
                ]
            },
            {
                title: '📈 Growth & Projections',
                explanation: 'Analysis of growth trends and future scaling predictions.',
                metrics: [
                    this.createMetricWithIndicator('Growth Sustainability', metrics.growth_sustainability),
                    this.createMetricWithIndicator('Scaling Readiness', metrics.scaling_readiness_score),
                    `Monthly Growth: ${this.formatPercentage(metrics.monthly_content_growth_rate || 0)}`,
                    `Expected Members (Next Year): ${Math.round(metrics.expected_members_next_year || 0)}`,
                    `Expected Pages (Next Year): ${metrics.expected_pages_next_year || 0}`,
                    `Growth Consistency: ${this.formatPercentage(metrics.growth_consistency || 0)}`
                ]
            },
            {
                title: '💎 ROI & Resource Utilization',
                explanation: 'Financial impact and resource efficiency analysis.',
                metrics: [
                    this.createMetricWithIndicator('Enterprise ROI', metrics.enterprise_roi),
                    this.createMetricWithIndicator('Resource Efficiency', metrics.content_efficiency),
                    `Current Cost: ${this.formatCurrency(metrics.current_monthly_cost || 0)}/month`,
                    `Projected Annual Savings: ${this.formatCurrency(metrics.enterprise_annual_savings || 0)}`,
                    `Time Saved: ${this.formatDecimal(metrics.projected_time_savings?.hours_per_member || 0)} hours/member/month`,
                    `Automation Potential: ${this.formatPercentage(metrics.automation_potential?.score || 0)}`
                ]
            },
            {
                title: '🎯 Key Recommendations',
                explanation: 'Actionable insights and suggestions for improvement.',
                metrics: [
                    'Structure: ' + this.getStructureRecommendation(metrics),
                    'Collaboration: ' + this.getCollaborationRecommendation(metrics),
                    'Growth: ' + this.getGrowthRecommendation(metrics),
                    'ROI: ' + this.getROIRecommendation(metrics)
                ]
            }
        ];

        return this.createFormattedBlocks(sections, metrics);
    }

    getStructureRecommendation(metrics) {
        if (metrics.deep_pages_count > 20) return 'Consider restructuring deep pages to improve navigation';
        if (metrics.duplicate_count > 10) return 'Focus on reducing content duplication';
        if (metrics.orphaned_blocks > 50) return 'Clean up orphaned content';
        return 'Maintain current structure while monitoring growth';
    }

    getCollaborationRecommendation(metrics) {
        if (metrics.teamAdoptionScore < 0.7) return 'Implement team training to boost adoption';
        if (metrics.collaborationDensity < 0.6) return 'Encourage cross-team collaboration';
        if (metrics.knowledgeSharingIndex < 0.5) return 'Promote knowledge sharing practices';
        return 'Continue fostering team collaboration';
    }

    getGrowthRecommendation(metrics) {
        if (metrics.growth_sustainability < 0.6) return 'Review growth strategy for sustainability';
        if (metrics.scaling_readiness_score < 0.7) return 'Prepare infrastructure for scaling';
        if (metrics.growth_consistency < 0.5) return 'Stabilize growth patterns';
        return 'Maintain current growth trajectory';
    }

    getROIRecommendation(metrics) {
        if (metrics.enterprise_roi < 0.5) return 'Optimize resource utilization';
        if (metrics.content_efficiency < 0.6) return 'Focus on content efficiency';
        if (metrics.automation_potential?.score > 0.8) return 'Implement automation opportunities';
        return 'Continue monitoring ROI metrics';
    }

    createSummarySection(metrics) {
        return {
            title: '📊 Key Metrics Summary',
            metrics: [
                this.createMetricLine('Workspace Scale', 
                    `${metrics.total_pages} pages, ${metrics.totalMembers} members`, 
                    'text', '🏢'),
                this.createMetricLine('Enterprise ROI', 
                    metrics.enterprise_roi, 
                    'percentage', '💰'),
                this.createMetricLine('Efficiency Score', 
                    metrics.efficiency_score, 
                    'percentage', '⚡'),
                this.createMetricLine('Growth Index', 
                    metrics.growth_sustainability_index, 
                    'percentage', '📈')
            ]
        };
    }

    createStructureSection(metrics) {
        return {
            title: '🏗️ Structure & Evolution Metrics',
            subsections: [
                {
                    subtitle: 'Basic Structure',
                    metrics: [
                        this.createGroupedMetrics('📑 Pages & Collections', [
                            this.createMetricPair('Total Pages', metrics.total_pages, 'Collections', metrics.collections_count),
                            this.createMetricPair('Collection Views', metrics.collection_views, 'Collection View Pages', metrics.collection_view_pages),
                            this.createMetricPair('Total Blocks', metrics.total_blocks, 'Alive Blocks', metrics.alive_blocks)
                        ])
                    ]
                },
                // ... other subsections for Navigation & Depth, Content Organization, etc.
            ]
        };
    }

    createGroupedMetrics(title, metricLines) {
        return {
            title,
            content: metricLines.map(line => `  ${line}`).join('\n')
        };
    }

    createMetricPair(label1, value1, label2, value2) {
        return `${label1}: ${this.formatMetric(value1)} | ${label2}: ${this.formatMetric(value2)}`;
    }

    getPerformanceIndicator(value, thresholds = { high: 0.9, medium: 0.7 }) {
        if (value === null || value === undefined) return this.PERFORMANCE_INDICATORS.NONE;
        const percentage = Number(value);
        if (isNaN(percentage)) return this.PERFORMANCE_INDICATORS.NONE;
        
        if (percentage >= thresholds.high) return this.PERFORMANCE_INDICATORS.HIGH;
        if (percentage >= thresholds.medium) return this.PERFORMANCE_INDICATORS.MEDIUM;
        return this.PERFORMANCE_INDICATORS.LOW;
    }

    createMetricWithIndicator(label, value, type = 'percentage') {
        const formattedValue = this.formatMetric(value, type);
        const indicator = this.getPerformanceIndicator(value);
        return `${label}: ${formattedValue} ${indicator}`;
    }

    createMetricsBlocks(metrics) {
        const sections = [
            this.createSummarySection(metrics),
            this.createStructureSection(metrics),
            this.createCollaborationSection(metrics),
            this.createGrowthSection(metrics),
            this.createROISection(metrics)
        ];

        return this.createFormattedBlocks(sections);
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
        if (value === null || value === undefined) return '0.0%';
        const num = Number(value);
        return isNaN(num) ? '0.0%' : `${(num * 100).toFixed(1)}%`;
    }

    formatCurrency(value) {
        if (value === null || value === undefined) return '$0.00';
        const num = Number(value);
        return isNaN(num) ? '$0.00' : new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    formatMetric(value, type = 'number') {
        if (value === null || value === undefined) {
            switch (type) {
                case 'percentage': return '0.0%';
                case 'currency': return '$0.00';
                case 'decimal': return '0.00';
                default: return '0';
            }
        }

        switch (type) {
            case 'percentage': return this.formatPercentage(value);
            case 'currency': return this.formatCurrency(value);
            case 'decimal': return this.formatDecimal(value);
            default: return String(value);
        }
    }

    createMetricLine(label, value, type, emoji) {
        return `${emoji} ${label}: ${this.formatMetric(value, type)}`;
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

    // Example usage in ROI section
    createROISection(metrics) {
        return [
            `${this.METRIC_EMOJIS.cost} Current Monthly Cost: ${this.formatCurrency(metrics.current_monthly_cost)}`,
            `${this.METRIC_EMOJIS.roi} Enterprise ROI: ${this.formatPercentage(metrics.enterprise_roi)}`,
            `${this.METRIC_EMOJIS.ai} AI Productivity: ${this.formatPercentage(metrics.ai_productivity_boost)}`
        ];
    }

    createFormattedBlocks(sections, metrics = null) {
        const blocks = [
            this.createHeading('Workspace Analysis Report', 1)
        ];

        // Add visualization if available
        if (metrics?.visualizationUrl) {
            blocks.push(
                this.createHeading('Workspace Structure Visualization', 2),
                this.createImage(metrics.visualizationUrl)
            );
        }

        // Add performance indicator legend at the top
        blocks.push(this.createPerformanceLegend());
        blocks.push(this.createDivider());

        sections.forEach(section => {
            // Add section title
            blocks.push(this.createHeading(section.title, 2));
            
            // Add section explanation if present
            if (section.explanation) {
                blocks.push({
                    type: 'paragraph',
                    text: {
                        content: section.explanation,
                        link: null
                    }
                });
            }
            
            // Add metrics
            if (section.metrics && section.metrics.length > 0) {
                if (section.subsections) {
                    section.subsections.forEach(subsection => {
                        blocks.push(this.createHeading(subsection.subtitle, 3));
                        blocks.push(...this.createBulletedList(subsection.metrics));
                    });
                } else {
                    blocks.push(...this.createBulletedList(section.metrics));
                }
            }
            
            blocks.push(this.createDivider());
        });

        return blocks;
    }

    createPerformanceLegend() {
        return {
            type: 'paragraph',
            text: {
                content: `Performance Indicators: ${this.PERFORMANCE_INDICATORS.HIGH} Excellent (>90%) | ${this.PERFORMANCE_INDICATORS.MEDIUM} Good (70-90%) | ${this.PERFORMANCE_INDICATORS.LOW} Needs Attention (<70%) | ${this.PERFORMANCE_INDICATORS.NONE} No Data`,
                link: null
            }
        };
    }
} 