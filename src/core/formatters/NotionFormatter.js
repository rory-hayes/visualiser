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
                    this.createMetricWithIndicator('Workspace Health Score', metrics.workspace_efficiency_score),
                    this.createMetricWithIndicator('Overall Efficiency', metrics.content_roi_score),
                    this.createMetricWithIndicator('ROI Score', metrics.overall_roi_score),
                    `Total Members: ${metrics.total_members || 0} | Active Members: ${metrics.total_members - (metrics.total_guests || 0)}`,
                    `Total Pages: ${metrics.total_pages || 0} | Active Pages: ${metrics.alive_pages_all || 0}`
                ]
            },
            {
                title: '🏗️ Structure & Evolution Metrics',
                explanation: 'Analysis of your workspace\'s organization, depth, and structural health.',
                metrics: [
                    this.createMetricWithIndicator('Structure Health Score', metrics.structure_health_score),
                    this.createMetricWithIndicator('Navigation Complexity', metrics.navigation_complexity_score),
                    this.createMetricWithIndicator('Content Organization', metrics.content_organization_score),
                    `Max Depth: ${metrics.max_depth || 0} | Collection Views: ${metrics.collection_views || 0}`,
                    `Collections: ${metrics.collections_count || 0} | Database Usage: ${this.formatPercentage(metrics.database_utilization_score || 0)}`,
                    `Content Health: ${this.formatPercentage(metrics.content_health_ratio || 0)} | Page Health: ${this.formatPercentage(metrics.page_health_ratio || 0)}`
                ]
            },
            {
                title: '🤝 Collaboration & Team Dynamics',
                explanation: 'Insights into how your team collaborates and utilizes the workspace.',
                metrics: [
                    this.createMetricWithIndicator('Team Adoption', metrics.team_adoption_score),
                    this.createMetricWithIndicator('Collaboration Score', metrics.collaboration_score),
                    this.createMetricWithIndicator('Cross-team Activity', metrics.cross_team_activity),
                    `Total Members: ${metrics.total_members || 0} | Total Guests: ${metrics.total_guests || 0}`,
                    `Teamspaces: ${metrics.total_teamspaces || 0} | Avg Members/Space: ${this.formatDecimal(metrics.average_members_per_teamspace || 0)}`,
                    `Integration Score: ${this.formatPercentage(metrics.integration_adoption_score || 0)} | Bot Usage: ${this.formatPercentage(metrics.bot_utilization_score || 0)}`
                ]
            },
            {
                title: '📈 Growth & Projections',
                explanation: 'Analysis of growth trends and future scaling predictions.',
                metrics: [
                    this.createMetricWithIndicator('Growth Sustainability', metrics.growth_sustainability),
                    this.createMetricWithIndicator('Scaling Readiness', metrics.scaling_readiness_score),
                    this.createMetricWithIndicator('Growth Balance', metrics.growth_balance_score),
                    `Monthly Growth: ${this.formatPercentage(metrics.monthly_content_growth_rate || 0)}`,
                    `Expected Members (Next Year): ${Math.round(metrics.expected_members_next_year || 0)}`,
                    `Growth Consistency: ${this.formatPercentage(metrics.growth_consistency || 0)}`
                ]
            },
            {
                title: '💎 ROI & Resource Utilization',
                explanation: 'Financial impact and resource efficiency analysis.',
                metrics: [
                    this.createMetricWithIndicator('Overall ROI', metrics.overall_roi_score),
                    this.createMetricWithIndicator('Content ROI', metrics.content_roi_score),
                    this.createMetricWithIndicator('Integration ROI', metrics.integration_roi_score),
                    `Revenue/Member: ${this.formatCurrency(metrics.revenue_per_member || 0)}`,
                    `Seat Utilization: ${this.formatPercentage(metrics.seat_utilization_rate || 0)}`,
                    `Integration Value: ${this.formatCurrency(metrics.estimated_integration_value || 0)}`
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
        if (metrics.content_health_ratio < 0.7) return 'Focus on improving content health and organization';
        if (metrics.navigation_complexity_score < 0.6) return 'Simplify workspace navigation structure';
        if (metrics.database_utilization_score < 0.5) return 'Optimize database usage and organization';
        return 'Maintain current structure while monitoring growth';
    }

    getCollaborationRecommendation(metrics) {
        if (metrics.team_adoption_score < 0.7) return 'Implement team training to boost adoption';
        if (metrics.collaboration_score < 0.6) return 'Encourage cross-team collaboration';
        if (metrics.cross_team_activity < 0.5) return 'Promote cross-team knowledge sharing';
        return 'Continue fostering team collaboration';
    }

    getGrowthRecommendation(metrics) {
        if (metrics.growth_sustainability < 0.6) return 'Review growth strategy for sustainability';
        if (metrics.scaling_readiness_score < 0.7) return 'Prepare infrastructure for scaling';
        if (metrics.growth_balance_score < 0.5) return 'Balance growth across different areas';
        return 'Maintain current growth trajectory';
    }

    getROIRecommendation(metrics) {
        if (metrics.overall_roi_score < 0.5) return 'Focus on improving overall workspace ROI';
        if (metrics.content_roi_score < 0.6) return 'Optimize content utilization and value';
        if (metrics.integration_roi_score < 0.5) return 'Enhance integration usage and efficiency';
        return 'Continue monitoring and optimizing ROI metrics';
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

    createMetricWithIndicator(label, value, type = 'percentage') {
        const formattedValue = this.formatMetric(value, type);
        const indicator = this.getPerformanceIndicator(value);
        return `${label}: ${formattedValue} ${indicator}`;
    }

    getPerformanceIndicator(value, thresholds = { high: 0.9, medium: 0.7 }) {
        if (value === null || value === undefined) return this.PERFORMANCE_INDICATORS.NONE;
        const percentage = Number(value);
        if (isNaN(percentage)) return this.PERFORMANCE_INDICATORS.NONE;
        
        if (percentage >= thresholds.high) return this.PERFORMANCE_INDICATORS.HIGH;
        if (percentage >= thresholds.medium) return this.PERFORMANCE_INDICATORS.MEDIUM;
        return this.PERFORMANCE_INDICATORS.LOW;
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
                blocks.push(...this.createBulletedList(section.metrics));
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