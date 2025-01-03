import { Dashboard } from './modules/dashboard.js';
import { Search } from './modules/search.js';
import { Filters } from './modules/filters.js';
import { Graph } from './modules/graph.js';
import { Stats } from './modules/stats.js';
import { initializePreviewGraph } from './preview-graph.js';

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
} 