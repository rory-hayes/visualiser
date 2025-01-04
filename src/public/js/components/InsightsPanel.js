export class InsightsPanel {
    constructor(container) {
        this.container = container;
        this.insights = null;
    }

    async initialize() {
        try {
            await this.fetchInsights();
            this.render();
        } catch (error) {
            console.error('Failed to initialize insights:', error);
        }
    }

    async fetchInsights() {
        const response = await fetch('/api/insights');
        if (!response.ok) throw new Error('Failed to fetch insights');
        this.insights = await response.json();
    }

    render() {
        this.container.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">AI Insights</h2>
                
                <!-- Structure Insights -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Workspace Structure</h3>
                    <div class="prose text-gray-600">
                        ${this.insights.insights}
                    </div>
                </div>

                <!-- Recommendations -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Recommendations</h3>
                    <ul class="space-y-2">
                        ${this.renderRecommendations()}
                    </ul>
                </div>

                <!-- Trends -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Growth Trends</h3>
                    <div class="h-48">
                        ${this.renderTrendsChart()}
                    </div>
                </div>
            </div>
        `;
    }

    renderRecommendations() {
        return this.insights.recommendations
            .map(rec => `
                <li class="flex items-start">
                    <svg class="h-5 w-5 text-indigo-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    <span class="text-gray-600">${rec}</span>
                </li>
            `)
            .join('');
    }

    renderTrendsChart() {
        // Implement chart rendering using Chart.js or D3.js
    }
} 