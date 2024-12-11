// Add at the top of the file for debugging
console.log('Script loaded');

// Remove the import for now since we'll load generateGraph only when needed
// import { generateGraph } from '../generateGraph.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    const getStartedButton = document.getElementById('getStarted');
    console.log('Get Started button found:', !!getStartedButton);
    
    const visualizationDiv = document.getElementById('visualization');

    // Check which page we're on
    if (getStartedButton && !visualizationDiv) {
        console.log('On landing page, setting up Get Started button');
        // Landing page logic
        getStartedButton.addEventListener('click', () => {
            console.log('Get Started clicked, redirecting to auth...');
            window.location.href = '/auth';
        });
    } else if (visualizationDiv) {
        console.log('On redirect page, initializing dashboard');
        try {
            // Update the import path
            const { generateGraph } = await import('/generateGraph.js');
            window.generateGraph = generateGraph;

            // Check for error parameter in URL
            const urlParams = new URLSearchParams(window.location.search);
            const error = urlParams.get('error');
            
            if (error) {
                showError(error);
            } else {
                initializeDashboard();
            }
        } catch (error) {
            console.error('Error loading generateGraph:', error);
            showError('Failed to load visualization components');
        }
    } else {
        console.error('Unable to determine current page');
    }
});

async function initializeDashboard() {
    const visualization = document.getElementById('visualization');
    
    // Show loading state
    showLoading(visualization);

    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        if (!data.graph || !data.score) {
            throw new Error('Invalid data format received from server');
        }

        // Clear loading state
        visualization.innerHTML = '';

        // Initialize the graph
        const graph = generateGraph(visualization, data.graph);

        // Update all metrics
        updateDashboardMetrics(data.graph, data.score);

        // Setup zoom control buttons
        setupZoomControls(graph);

        // Setup event listeners
        setupEventListeners(graph);

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError(error.message);
    }
}

function showLoading(container) {
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p class="text-gray-600">Loading workspace data...</p>
            </div>
        </div>
    `;
}

function showError(message) {
    const visualization = document.getElementById('visualization');
    if (visualization) {
        visualization.innerHTML = `
            <div class="p-4 text-red-600 bg-red-100 rounded-lg">
                <h3 class="font-bold">Error Loading Dashboard</h3>
                <p>${message}</p>
                <button onclick="window.location.href='/'" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    Start Over
                </button>
            </div>
        `;
    }
}

function setupZoomControls(graph) {
    // Zoom in button
    document.getElementById('zoomIn').addEventListener('click', () => {
        const svg = d3.select('#visualization svg');
        const zoom = d3.zoom().on('zoom', (event) => {
            svg.select('g').attr('transform', event.transform);
        });
        
        const currentTransform = d3.zoomTransform(svg.node());
        svg.transition().duration(300).call(
            zoom.transform,
            currentTransform.scale(currentTransform.k * 1.2)
        );
    });

    // Zoom out button
    document.getElementById('zoomOut').addEventListener('click', () => {
        const svg = d3.select('#visualization svg');
        const zoom = d3.zoom().on('zoom', (event) => {
            svg.select('g').attr('transform', event.transform);
        });
        
        const currentTransform = d3.zoomTransform(svg.node());
        svg.transition().duration(300).call(
            zoom.transform,
            currentTransform.scale(currentTransform.k / 1.2)
        );
    });

    // Reset zoom button
    document.getElementById('resetZoom').addEventListener('click', () => {
        const svg = d3.select('#visualization svg');
        const zoom = d3.zoom().on('zoom', (event) => {
            svg.select('g').attr('transform', event.transform);
        });
        
        svg.transition().duration(300).call(
            zoom.transform,
            d3.zoomIdentity
        );
    });
}

function setupEventListeners(graph) {
    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        // TODO: Implement export functionality
        console.log('Export functionality coming soon');
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await initializeDashboard();
    });
}

function updateDashboardMetrics(graph, score) {
    // Update workspace score
    document.getElementById('workspaceScore').innerText = score;

    // Calculate and update basic metrics
    const totalPages = graph.nodes.length;
    const databases = graph.nodes.filter(node => node.type === 'database');
    
    document.getElementById('totalPages').innerText = totalPages;
    document.getElementById('totalDatabases').innerText = databases.length;
    
    // Update activity metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const activePages = graph.nodes.filter(node => {
        const lastEdited = new Date(node.last_edited_time);
        return lastEdited > thirtyDaysAgo;
    }).length;

    document.getElementById('activePages').innerText = activePages;
    document.getElementById('last30Days').innerText = activePages;
    document.getElementById('last60Days').innerText = graph.nodes.filter(node => {
        const lastEdited = new Date(node.last_edited_time);
        return lastEdited > sixtyDaysAgo;
    }).length;
    document.getElementById('last90Days').innerText = graph.nodes.filter(node => {
        const lastEdited = new Date(node.last_edited_time);
        return lastEdited > ninetyDaysAgo;
    }).length;
    document.getElementById('over90Days').innerText = graph.nodes.filter(node => {
        const lastEdited = new Date(node.last_edited_time);
        return lastEdited <= ninetyDaysAgo;
    }).length;

    // Update structure metrics
    document.getElementById('maxDepth').innerText = calculateMaxDepth(graph);
    document.getElementById('avgPagesPerLevel').innerText = calculateAvgPagesPerLevel(graph);
    document.getElementById('totalConnections').innerText = graph.links.length;
}

function calculateMaxDepth(graph) {
    // Implementation of depth calculation
    // This is a placeholder - we'll need to implement the actual depth calculation
    return '0';
}

function calculateAvgPagesPerLevel(graph) {
    // Implementation of average pages per level calculation
    // This is a placeholder - we'll need to implement the actual calculation
    return '0';
}