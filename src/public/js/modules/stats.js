export class Stats {
    constructor() {
        this.currentData = null;
    }

    updateStats(data) {
        if (!data || !data.metrics) {
            console.error('Invalid data for stats update');
            return;
        }

        const { metrics } = data;

        this.updateElement('workspaceScore', metrics.score);
        this.updateElement('totalPages', metrics.totalPages);
        this.updateElement('activePages', metrics.activePages);
        this.updateElement('maxDepth', metrics.maxDepth);
        this.updateElement('totalConnections', metrics.totalConnections);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = typeof value === 'number' ? value.toString() : '--';
        }
    }
} 