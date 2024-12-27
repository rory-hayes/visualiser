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