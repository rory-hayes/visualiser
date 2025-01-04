import { InsightsPanel } from './components/InsightsPanel.js';

class InsightsPage {
    constructor() {
        this.structureContainer = document.getElementById('structureInsights');
        this.recommendationsContainer = document.getElementById('recommendationsInsights');
        this.trendsContainer = document.getElementById('trendsInsights');
    }

    async initialize() {
        try {
            const response = await fetch('/api/insights');
            if (!response.ok) {
                throw new Error(`Failed to fetch insights: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.renderInsights(data);
        } catch (error) {
            console.error('Failed to initialize insights:', error);
            this.renderError(error);
        }
    }

    renderInsights(data) {
        // Structure Analysis
        this.structureContainer.innerHTML = this.renderStructureAnalysis(data.structureAnalysis);
        
        // Recommendations
        this.recommendationsContainer.innerHTML = this.renderRecommendations(data.recommendations);
        
        // Trends
        if (data.trends) {
            this.renderTrendsChart(data.trends);
        }
    }

    renderStructureAnalysis(analysis) {
        return `
            <div class="space-y-6">
                <div class="prose">
                    <h3 class="text-lg font-semibold">Executive Summary</h3>
                    <p class="text-gray-600">${analysis.summary}</p>
                </div>
                
                ${Object.entries(analysis)
                    .filter(([key]) => key !== 'summary' && key !== 'issues')
                    .map(([category, data]) => `
                        <div class="border-t pt-4">
                            <h4 class="font-medium text-gray-900 capitalize">${category}</h4>
                            <div class="mt-2 flex items-center">
                                <div class="w-16 h-16 rounded-full border-4 border-indigo-200 flex items-center justify-center">
                                    <span class="text-xl font-bold text-indigo-600">${data.score}</span>
                                </div>
                                <p class="ml-4 text-gray-600">${data.analysis}</p>
                            </div>
                        </div>
                    `).join('')}
                
                ${analysis.issues.length > 0 ? `
                    <div class="border-t pt-4">
                        <h4 class="font-medium text-gray-900">Identified Issues</h4>
                        <ul class="mt-2 space-y-2">
                            ${analysis.issues.map(issue => `
                                <li class="flex items-start">
                                    <span class="text-red-500 mr-2">•</span>
                                    <span class="text-gray-600">${issue}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderRecommendations(recommendations) {
        return recommendations
            .map(rec => `
                <div class="flex items-start space-x-3">
                    <svg class="h-5 w-5 text-indigo-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    <div>
                        <p class="font-medium">${rec.recommendation}</p>
                        <p class="text-sm text-gray-600 mt-1">${rec.benefit}</p>
                        <p class="text-sm text-gray-500 mt-1">${rec.implementation}</p>
                    </div>
                </div>
            `)
            .join('');
    }

    renderError(error) {
        const errorMessage = `
            <div class="text-red-600 bg-red-50 p-4 rounded-lg">
                <p class="font-semibold">Error loading insights</p>
                <p class="text-sm mt-1">${error.message}</p>
            </div>
        `;

        this.structureContainer.innerHTML = errorMessage;
        this.recommendationsContainer.innerHTML = errorMessage;
        this.trendsContainer.innerHTML = errorMessage;
    }

    renderTrendsChart(trends) {
        // Implement chart rendering using Chart.js
        const ctx = this.trendsContainer;
        new Chart(ctx, {
            type: 'line',
            data: {
                // Configure chart data based on trends
            },
            options: {
                // Configure chart options
            }
        });
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    const page = new InsightsPage();
    page.initialize();
}); 