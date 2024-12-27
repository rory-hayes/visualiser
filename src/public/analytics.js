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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Activity on ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            return `${context.parsed.y} edits made`;
                        },
                        footer: function(tooltipItems) {
                            return 'Click to see detailed activity for this day';
                        }
                    }
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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Growth as of ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            return `${context.parsed.y} total pages`;
                        },
                        footer: function() {
                            return 'Shows cumulative workspace growth';
                        }
                    }
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = (context.parsed / context.dataset.data.reduce((a, b) => a + b) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        },
                        footer: function() {
                            return 'Click to filter by content type';
                        }
                    }
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
                backgroundColor: data.counts.map((_, index) => 
                    index === 0 ? 'rgb(16, 185, 129)' :  // Root level (green)
                    index <= 2 ? 'rgb(99, 102, 241)' :   // Optimal levels (blue)
                    'rgb(244, 63, 94)'                   // Deep levels (red)
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} pages at ${context.label}`;
                        },
                        title: function(tooltipItems) {
                            const depth = tooltipItems[0].dataIndex;
                            if (depth === 0) return 'Root Level Pages';
                            if (depth <= 2) return 'Optimal Depth';
                            return 'Deep Hierarchy';
                        }
                    }
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
                        text: 'Hierarchy Level'
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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Activity at ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            return `${context.parsed.y} actions performed`;
                        },
                        footer: function(tooltipItems) {
                            const hour = parseInt(tooltipItems[0].label);
                            if (hour >= 9 && hour <= 17) return 'Peak working hours';
                            if (hour >= 23 || hour <= 5) return 'Off-hours activity';
                            return 'Regular activity hours';
                        }
                    }
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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return 'Page Connections';
                        },
                        label: function(context) {
                            return [
                                `Incoming: ${context.parsed.x} connections`,
                                `Outgoing: ${context.parsed.y} connections`,
                                `Total: ${context.parsed.x + context.parsed.y} connections`
                            ];
                        },
                        footer: function(tooltipItems) {
                            const total = tooltipItems[0].parsed.x + tooltipItems[0].parsed.y;
                            return total > 10 ? 'Highly connected page' : 
                                   total > 5 ? 'Well-connected page' : 
                                   'Could use more connections';
                        }
                    }
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

    // Add click handlers for chart elements
    Object.values(charts).forEach(chart => {
        if (!chart) return;
        
        chart.canvas.addEventListener('click', (evt) => {
            const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                const data = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                handleChartClick(chart.canvas.id, data, firstPoint);
            }
        });
    });
}

function handleChartClick(chartId, data, point) {
    switch(chartId) {
        case 'activityChart':
            // Show detailed activity for that day
            showDetailedActivity(data, point);
            break;
        case 'contentTypeChart':
            // Filter workspace view by content type
            filterByContentType(data, point);
            break;
        case 'connectionChart':
            // Show connected pages
            showConnectedPages(data, point);
            break;
    }
}

function showDetailedActivity(data, point) {
    const date = point.label;
    const modalTitle = `Activity Details for ${date}`;
    const modalContent = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-700 mb-2">Activity Summary</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500">Total Edits</p>
                        <p class="text-lg font-medium">${data}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Active Users</p>
                        <p class="text-lg font-medium">${data > 0 ? Math.ceil(data / 3) : 0}</p>
                    </div>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        onclick="exportActivityData('${date}', ${data})">
                    Export Details
                </button>
            </div>
        </div>
    `;
    showModal(modalTitle, modalContent);
}

function filterByContentType(data, point) {
    const type = point.label;
    const percentage = ((data / point.dataset.data.reduce((a, b) => a + b)) * 100).toFixed(1);
    const modalTitle = `${type} Content Analysis`;
    const modalContent = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-700 mb-2">Distribution</h4>
                <div class="flex items-center">
                    <div class="flex-grow">
                        <div class="h-4 bg-gray-200 rounded-full">
                            <div class="h-4 bg-indigo-600 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <span class="ml-4 text-sm font-medium">${percentage}%</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-2">Recommendations</h4>
                    ${generateRecommendations(type, percentage)}
                </div>
            </div>
        </div>
    `;
    showModal(modalTitle, modalContent);
}

function showConnectedPages(data, point) {
    const incoming = point.parsed.x;
    const outgoing = point.parsed.y;
    const modalTitle = 'Page Connection Details';
    const modalContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-700 mb-2">Connection Health</h4>
                ${generateConnectionHealth(incoming, outgoing)}
            </div>
        </div>
    `;
    showModal(modalTitle, modalContent);
}

function generateRecommendations(type, percentage) {
    const recommendations = {
        Pages: [
            percentage < 50 ? 'Consider creating more documentation pages' : 'Good balance of pages',
            'Ensure pages are well-connected',
            'Regular content reviews recommended'
        ],
        Databases: [
            percentage < 20 ? 'Could benefit from more structured data' : 'Good use of databases',
            'Consider linking databases to related pages',
            'Review database schemas periodically'
        ],
        Templates: [
            percentage < 10 ? 'Create more templates for consistency' : 'Good template coverage',
            'Keep templates up to date',
            'Document template usage'
        ]
    };

    return (recommendations[type] || ['No specific recommendations']).map(rec => 
        `<div class="text-sm text-gray-600 mb-2">• ${rec}</div>`
    ).join('');
}

function generateConnectionHealth(incoming, outgoing) {
    const total = incoming + outgoing;
    const health = total > 10 ? 'Excellent' : total > 5 ? 'Good' : 'Needs Improvement';
    const color = total > 10 ? 'text-green-600' : total > 5 ? 'text-yellow-600' : 'text-red-600';
    
    return `
        <div class="flex items-center justify-between">
            <span class="text-sm">Connection Health:</span>
            <span class="font-medium ${color}">${health}</span>
        </div>
        <div class="mt-2 text-sm text-gray-600">
            ${getConnectionRecommendation(total)}
        </div>
    `;
}

function getConnectionRecommendation(total) {
    if (total > 10) return 'Well-connected page. Keep maintaining these connections.';
    if (total > 5) return 'Good connectivity. Consider adding more cross-references.';
    return 'This page could benefit from more connections to related content.';
}

// Modal handling
function showModal(title, content) {
    const modal = document.getElementById('chartModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
    
    document.getElementById('closeModal').onclick = () => {
        modal.classList.add('hidden');
    };
}

// Export functionality
function exportActivityData(date, count) {
    const data = {
        date,
        totalEdits: count,
        activeUsers: Math.ceil(count / 3),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    document.querySelectorAll('.chart-container').forEach(container => {
        // Clear any existing content
        container.innerHTML = '';

        const overlay = document.createElement('div');
        overlay.className = 'w-full h-full flex items-center justify-center bg-gray-50 rounded-lg';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p class="text-sm text-gray-600">Loading chart data...</p>
            </div>
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

// Add these configurations to each chart's options

const enhancedTooltipOptions = {
    activity: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
            // ... existing callbacks ...
            afterBody: (tooltipItems) => {
                const value = tooltipItems[0].parsed.y;
                return [
                    '',
                    `Active Users: ~${Math.ceil(value / 3)}`,
                    'Click for detailed breakdown'
                ];
            }
        }
    },
    // Similar configurations for other charts...
};

// Apply these options to each chart
charts.activity.options.plugins.tooltip = {
    ...charts.activity.options.plugins.tooltip,
    ...enhancedTooltipOptions.activity
}; 