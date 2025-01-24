export class MetricsDisplay {
    constructor(container) {
        this.container = typeof container === 'string' ? 
            document.getElementById(container) : container;
        
        if (!this.container) {
            throw new Error('Metrics container not found');
        }

        this.setupContainer();
    }

    setupContainer() {
        this.container.innerHTML = '';
        this.container.className = 'metrics-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4';
    }

    displayMetrics(metrics) {
        this.setupContainer();
        
        // Structure metrics
        this.createMetricsSection('Structure Metrics', {
            'Total Pages': metrics.total_pages,
            'Max Depth': metrics.max_depth,
            'Average Depth': metrics.avg_depth.toFixed(2),
            'Deep Pages': metrics.deep_pages_count,
            'Root Pages': metrics.root_pages,
            'Collections': metrics.collections_count,
            'Linked Databases': metrics.linked_database_count,
            'Templates': metrics.template_count,
            'Duplicates': metrics.duplicate_count,
            'Bottlenecks': metrics.bottleneck_count,
            'Navigation Score': metrics.nav_depth_score.toFixed(2)
        });

        // Usage metrics
        this.createMetricsSection('Usage Metrics', {
            'Total Members': metrics.total_num_members,
            'Total Guests': metrics.total_num_guests,
            'Total Teamspaces': metrics.total_num_teamspaces,
            'Total Integrations': metrics.total_num_integrations,
            'Total Bots': metrics.total_num_bots,
            'Avg Teamspace Members': metrics.average_teamspace_members.toFixed(2),
            'Automation Rate': `${metrics.automation_usage_rate.toFixed(2)}%`,
            'Integration Coverage': `${metrics.current_integration_coverage.toFixed(2)}%`,
            'Efficiency Gain': `${metrics.automation_efficiency_gain.toFixed(2)}%`
        });

        // Growth metrics
        this.createMetricsSection('Growth Metrics', {
            'Member Growth Rate': `${metrics.monthly_member_growth_rate.toFixed(2)}%`,
            'Content Growth Rate': `${metrics.monthly_content_growth_rate.toFixed(2)}%`,
            'Growth Capacity': `${metrics.growth_capacity.toFixed(2)}%`,
            'Expected Members (1yr)': Math.round(metrics.expected_members_in_next_year)
        });

        // Organization metrics
        this.createMetricsSection('Organization Metrics', {
            'Visibility Score': `${metrics.current_visibility_score.toFixed(2)}%`,
            'Collaboration Score': `${metrics.current_collaboration_score.toFixed(2)}%`,
            'Productivity Score': `${metrics.current_productivity_score.toFixed(2)}%`,
            'Organization Score': `${metrics.current_organization_score.toFixed(2)}%`,
            'Projected Score': `${metrics.projected_organisation_score.toFixed(2)}%`,
            'Improvement': `${metrics.success_improvement.toFixed(2)}%`
        });

        // ROI metrics
        this.createMetricsSection('ROI Metrics', {
            'Current Plan Cost': this.formatCurrency(metrics.current_plan),
            'Enterprise Plan Cost': this.formatCurrency(metrics.enterprise_plan),
            'Enterprise + AI Cost': this.formatCurrency(metrics.enterprise_plan_w_ai),
            '10% Productivity Gain': this.formatCurrency(metrics['10_percent_increase']),
            '20% Productivity Gain': this.formatCurrency(metrics['20_percent_increase']),
            '50% Productivity Gain': this.formatCurrency(metrics['50_percent_increase']),
            'Enterprise ROI': `${metrics.enterprise_plan_roi.toFixed(2)}%`,
            'Enterprise + AI ROI': `${metrics.enterprise_plan_w_ai_roi.toFixed(2)}%`
        });
    }

    createMetricsSection(title, metrics) {
        const section = document.createElement('div');
        section.className = 'bg-white shadow rounded-lg p-4';

        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold mb-4 text-gray-800';
        titleElement.textContent = title;
        section.appendChild(titleElement);

        const list = document.createElement('div');
        list.className = 'space-y-2';

        Object.entries(metrics).forEach(([key, value]) => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center';

            const label = document.createElement('span');
            label.className = 'text-sm text-gray-600';
            label.textContent = key;

            const valueElement = document.createElement('span');
            valueElement.className = this.getValueClass(value);
            valueElement.textContent = value;

            item.appendChild(label);
            item.appendChild(valueElement);
            list.appendChild(item);
        });

        section.appendChild(list);
        this.container.appendChild(section);
    }

    getValueClass(value) {
        let baseClass = 'text-sm font-medium';
        
        if (typeof value === 'string') {
            if (value.includes('%')) {
                const numValue = parseFloat(value);
                if (numValue > 0) {
                    return `${baseClass} text-green-600`;
                } else if (numValue < 0) {
                    return `${baseClass} text-red-600`;
                }
            }
        }
        
        return `${baseClass} text-gray-900`;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
} 