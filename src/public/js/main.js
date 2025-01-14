import { Dashboard } from './modules/dashboard.js';
import { Search } from './modules/search.js';
import { Filters } from './modules/filters.js';
import { Graph } from './modules/graph.js';
import { Stats } from './modules/stats.js';
import { initializePreviewGraph } from './preview-graph.js';
import { InsightsPanel } from './components/InsightsPanel.js';

document.addEventListener('DOMContentLoaded', () => {
    const isLandingPage = window.location.pathname === '/';

    if (isLandingPage) {
        initializeLandingPage();
        initializePreviewGraph();
    } else {
        initializeDashboard();
    }
});

function initializeLandingPage() {
    const getStartedButton = document.getElementById('getStarted');
    if (getStartedButton) {
        getStartedButton.addEventListener('click', () => {
            window.location.href = '/auth';
        });
    }
}

async function initializeDashboard() {
    const dashboard = new Dashboard();
    await dashboard.initialize();

    // Initialize AI Insights
    console.log('Initializing AI components...');
    const insightsContainer = document.getElementById('aiInsights');
    if (insightsContainer) {
        const insightsPanel = new InsightsPanel(insightsContainer);
        await insightsPanel.initialize();
    } else {
        console.error('AI Insights container not found');
    }
}

async function handleGenerateReport() {
    try {
        const workspaceId = getCurrentWorkspaceId();
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate report');
        }

        // Show success message to user
        showNotification('Report generation started successfully');
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    // Implement this based on your UI framework
    // For example, you could use a toast notification
    console.log(`${type}: ${message}`);
}

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
}); 