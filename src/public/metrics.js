document.addEventListener('DOMContentLoaded', () => {
    initializeMetricsPage();
    setupEventListeners();
});

async function initializeMetricsPage() {
    try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
            throw new Error('Failed to fetch metrics data');
        }

        const data = await response.json();
        updateMetrics(data);
    } catch (error) {
        console.error('Error initializing metrics page:', error);
        showError(error.message);
    }
}

function updateMetrics(data) {
    // Update overview section
    document.getElementById('overallScore').textContent = data.workspaceScore || '--';
    document.getElementById('lastUpdated').textContent = formatDate(data.lastUpdated);
    document.getElementById('totalContent').textContent = data.totalPages || '--';

    // Update structure metrics
    document.getElementById('structureScore').textContent = data.scores.structure || '--';
    document.getElementById('maxDepth').textContent = data.metrics.maxDepth || '--';
    document.getElementById('rootPages').textContent = data.metrics.rootPages || '--';
    document.getElementById('pageCount').textContent = data.metrics.pages || '--';
    document.getElementById('databaseCount').textContent = data.metrics.databases || '--';

    // Update activity metrics
    document.getElementById('activityScore').textContent = data.scores.activity || '--';
    document.getElementById('last7Days').textContent = data.metrics.last7Days || '--';
    document.getElementById('last30Days').textContent = data.metrics.last30Days || '--';
    document.getElementById('activePages').textContent = data.metrics.activePages || '--';
    document.getElementById('stalePages').textContent = data.metrics.stalePages || '--';

    // Update connectivity metrics
    document.getElementById('connectivityScore').textContent = data.scores.connectivity || '--';
    document.getElementById('totalLinks').textContent = data.metrics.totalLinks || '--';
    document.getElementById('avgLinks').textContent = formatDecimal(data.metrics.avgLinks) || '--';
    document.getElementById('connectedPages').textContent = data.metrics.connectedPages || '--';
    document.getElementById('isolatedPages').textContent = data.metrics.isolatedPages || '--';

    // Update content analysis
    document.getElementById('contentScore').textContent = data.scores.content || '--';
    document.getElementById('totalDatabases').textContent = data.metrics.totalDatabases || '--';
    document.getElementById('linkedDatabases').textContent = data.metrics.linkedDatabases || '--';
    document.getElementById('docPages').textContent = data.metrics.docPages || '--';
    document.getElementById('templatePages').textContent = data.metrics.templatePages || '--';
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
    // Implementation for error display
    console.error(message);
} 