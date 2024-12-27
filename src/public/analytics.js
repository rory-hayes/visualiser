// Store chart instances globally so we can destroy them later
let charts = {
    activity: null,
    growth: null,
    contentType: null,
    depth: null,
    activityTime: null,
    connection: null
};

document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    setupEventListeners();
});

async function initializeAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        updateCharts(data);
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showError(error.message);
    }
}

function updateCharts(data) {
    // Destroy existing charts before creating new ones
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });

    createActivityChart(data.activity);
    createGrowthChart(data.growth);
    createContentTypeChart(data.contentTypes);
    createDepthChart(data.pageDepth);
    createActivityTimeChart(data.activityTimes);
    createConnectionChart(data.connections);
}

function createActivityChart(data) {
    const ctx = document.getElementById('activityChart').getContext('2d');
    charts.activity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Page Edits',
                data: data.edits,
                borderColor: 'rgb(99, 102, 241)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Edits'
                    }
                }
            }
        }
    });
}

function createGrowthChart(data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    charts.growth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Pages',
                data: data.totalPages,
                borderColor: 'rgb(16, 185, 129)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Pages'
                    }
                }
            }
        }
    });
}

function createContentTypeChart(data) {
    const ctx = document.getElementById('contentTypeChart').getContext('2d');
    charts.contentType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pages', 'Databases', 'Templates', 'Other'],
            datasets: [{
                data: [
                    data.pages,
                    data.databases,
                    data.templates,
                    data.other
                ],
                backgroundColor: [
                    'rgb(99, 102, 241)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(107, 114, 128)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createDepthChart(data) {
    const ctx = document.getElementById('depthChart').getContext('2d');
    charts.depth = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Pages at Depth',
                data: data.counts,
                backgroundColor: 'rgb(99, 102, 241)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Pages'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Depth Level'
                    }
                }
            }
        }
    });
}

function createActivityTimeChart(data) {
    const ctx = document.getElementById('activityTimeChart').getContext('2d');
    charts.activityTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Activity Level',
                data: data.counts,
                backgroundColor: 'rgb(16, 185, 129)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Actions'
                    }
                }
            }
        }
    });
}

function createConnectionChart(data) {
    const ctx = document.getElementById('connectionChart').getContext('2d');
    charts.connection = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pages',
                data: data.points,
                backgroundColor: 'rgb(99, 102, 241)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Outgoing Connections'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Incoming Connections'
                    }
                }
            }
        }
    });
}

function setupEventListeners() {
    document.getElementById('timeRange').addEventListener('change', async (e) => {
        const days = e.target.value;
        try {
            // Show loading state
            showLoading();
            const response = await fetch(`/api/analytics?days=${days}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }
            const data = await response.json();
            updateCharts(data);
            // Hide loading state
            hideLoading();
        } catch (error) {
            console.error('Error updating charts:', error);
            showError(error.message);
        }
    });
}

function showError(message) {
    const errorHtml = `
        <div class="fixed inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-md">
                <h3 class="text-lg font-bold text-red-600 mb-2">Error Loading Analytics</h3>
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
    // Add loading overlay to each chart container
    document.querySelectorAll('.chart-container').forEach(container => {
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center';
        overlay.innerHTML = `
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        `;
        container.style.position = 'relative';
        container.appendChild(overlay);
    });
}

function hideLoading() {
    // Remove loading overlays
    document.querySelectorAll('.chart-container > div').forEach(overlay => {
        overlay.remove();
    });
} 