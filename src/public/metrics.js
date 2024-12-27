document.addEventListener('DOMContentLoaded', () => {
    initializeMetricsPage();
    setupEventListeners();
});

async function initializeMetricsPage() {
    showLoading();
    try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
            throw new Error('Failed to fetch metrics data');
        }

        const data = await response.json();
        updateMetrics(data);
        hideLoading();
    } catch (error) {
        console.error('Error initializing metrics page:', error);
        showError(error.message);
    }
}

function updateMetrics(data) {
    console.log('Updating metrics with data:', data);

    // Update overview section
    document.getElementById('overallScore').textContent = 
        typeof data.workspaceScore === 'number' ? Math.round(data.workspaceScore) : '--';
    document.getElementById('lastUpdated').textContent = 
        formatDate(data.lastUpdated) || '--';
    document.getElementById('totalContent').textContent = 
        data.metrics.pages + data.metrics.databases || '--';

    // Update structure metrics
    document.getElementById('structureScore').textContent = 
        data.scores.structure || '--';
    document.getElementById('maxDepth').textContent = 
        data.metrics.maxDepth || '--';
    document.getElementById('rootPages').textContent = 
        data.metrics.rootPages || '--';
    document.getElementById('pageCount').textContent = 
        data.metrics.pages || '--';
    document.getElementById('databaseCount').textContent = 
        data.metrics.databases || '--';

    // Update activity metrics
    document.getElementById('activityScore').textContent = 
        data.scores.activity || '--';
    document.getElementById('last7Days').textContent = 
        data.metrics.last7Days || '--';
    document.getElementById('last30Days').textContent = 
        data.metrics.last30Days || '--';
    document.getElementById('activePages').textContent = 
        data.metrics.activePages || '--';
    document.getElementById('stalePages').textContent = 
        data.metrics.stalePages || '--';

    // Update connectivity metrics
    document.getElementById('connectivityScore').textContent = 
        data.scores.connectivity || '--';
    document.getElementById('totalLinks').textContent = 
        data.metrics.totalLinks || '--';
    document.getElementById('avgLinks').textContent = 
        formatDecimal(data.metrics.avgLinks) || '--';
    document.getElementById('connectedPages').textContent = 
        data.metrics.connectedPages || '--';
    document.getElementById('isolatedPages').textContent = 
        data.metrics.isolatedPages || '--';

    // Update content analysis
    document.getElementById('contentScore').textContent = 
        data.scores.content || '--';
    document.getElementById('totalDatabases').textContent = 
        data.metrics.totalDatabases || '--';
    document.getElementById('linkedDatabases').textContent = 
        data.metrics.linkedDatabases || '--';
    document.getElementById('docPages').textContent = 
        data.metrics.docPages || '--';
    document.getElementById('templatePages').textContent = 
        data.metrics.templatePages || '--';

    // Update health monitoring section
    if (data.health) {
        document.getElementById('healthScore').textContent = data.health.score;
        document.getElementById('emptyPages').textContent = data.health.metrics.emptyPages;
        document.getElementById('brokenLinks').textContent = data.health.metrics.brokenLinks;
        document.getElementById('duplicateContent').textContent = data.health.metrics.duplicateContent;
        document.getElementById('orphanedPages').textContent = data.health.metrics.orphanedPages;
        document.getElementById('staleContent').textContent = data.health.metrics.staleContent;
        document.getElementById('inconsistentNaming').textContent = data.health.metrics.inconsistentNaming;

        // Update health alerts
        const alertsContainer = document.getElementById('healthAlerts');
        alertsContainer.innerHTML = data.health.alerts.map(alert => `
            <div class="flex items-center p-2 rounded ${getAlertColorClass(alert.type)}">
                ${getAlertIcon(alert.type)}
                <span class="ml-2">${alert.message}</span>
            </div>
        `).join('');
    }

    console.log('Metrics updated successfully');
}

function setupEventListeners() {
    document.querySelectorAll('.see-more').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const detailSection = document.getElementById(targetId);
            
            // Toggle expanded class
            detailSection.classList.toggle('expanded');
            
            // Update button text
            button.textContent = detailSection.classList.contains('expanded') 
                ? 'Show less' 
                : 'See details';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDecimal(number) {
    if (typeof number !== 'number') return '--';
    return number.toFixed(1);
}

function showError(message) {
    const errorHtml = `
        <div class="fixed inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-md">
                <h3 class="text-lg font-bold text-red-600 mb-2">Error Loading Metrics</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="window.location.reload()" 
                        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Retry
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', errorHtml);
}

function showLoading() {
    const elements = document.querySelectorAll('[id]');
    elements.forEach(el => {
        if (el.textContent === '--') {
            el.textContent = 'Loading...';
        }
    });
}

function hideLoading() {
    const elements = document.querySelectorAll('[id]');
    elements.forEach(el => {
        if (el.textContent === 'Loading...') {
            el.textContent = '--';
        }
    });
}

function getAlertColorClass(type) {
    switch (type) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'warning': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-blue-100 text-blue-800';
    }
}

function getAlertIcon(type) {
    const iconClass = type === 'critical' ? 'text-red-500' : 
                     type === 'warning' ? 'text-yellow-500' : 
                     'text-blue-500';
    return `
        <svg class="w-5 h-5 ${iconClass}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z"/>
        </svg>
    `;
} 