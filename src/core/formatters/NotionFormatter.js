export class NotionFormatter {
    async createMetricsBlocks(metrics) {
        const blocks = [];

        // Add visualization section if available
        if (metrics.visualizationUrl) {
            blocks.push(
                this.createHeading('Workspace Visualization'),
                this.createImage(metrics.visualizationUrl)
            );
        }

        // Structure Metrics
        blocks.push(
            this.createHeading('Structure Metrics'),
            this.createMetricsTable([
                { name: 'Total Pages', value: this.formatNumber(metrics.total_pages) },
                { name: 'Collections Count', value: this.formatNumber(metrics.collections_count) },
                { name: 'Collection Views', value: this.formatNumber(metrics.collection_views) },
                { name: 'Collection View Pages', value: this.formatNumber(metrics.collection_view_pages) },
                { name: 'Structured Pages Ratio', value: this.formatPercentage(metrics.structured_pages_ratio) },
                { name: 'Navigation Complexity', value: this.formatDecimal(metrics.navigation_complexity) },
                { name: 'Content Diversity', value: this.formatDecimal(metrics.content_diversity) }
            ])
        );

        // Add title
        blocks.push(this.createHeading('Workspace Analysis Report', 1));

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
        return value ? value.toFixed(2) : '0.00';
    }

    formatPercentage(value) {
        return value ? `${(value).toFixed(1)}%` : '0.0%';
    }

    formatCurrency(value) {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    }

    createImage(url) {
        return {
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