document.addEventListener('DOMContentLoaded', () => {
    const getStartedButton = document.getElementById('getStarted');
    if (getStartedButton) {
        // Landing page logic
        getStartedButton.addEventListener('click', () => {
            window.location.href = '/auth';
        });
    } else {
        // Check for error parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
            const visualization = document.getElementById('visualization');
            if (visualization) {
                visualization.innerHTML = `
                    <div class="p-4 text-red-600 bg-red-100 rounded-lg">
                        <h3 class="font-bold">Error During Authentication</h3>
                        <p>${decodeURIComponent(error)}</p>
                        <button onclick="window.location.href='/'" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                            Try Again
                        </button>
                    </div>
                `;
            }
        } else {
            // Initialize dashboard if no error
            initializeDashboard();
        }
    }
});

async function initializeDashboard() {
    const visualization = document.getElementById('visualization');
    
    // Show loading state
    if (visualization) {
        visualization.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p class="text-gray-600">Loading workspace data...</p>
                </div>
            </div>
        `;
    }

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

        // Update all metrics
        updateDashboardMetrics(data.graph, data.score);
        // Render the graph
        renderGraph(data.graph);
        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        if (visualization) {
            visualization.innerHTML = `
                <div class="p-4 text-red-600 bg-red-100 rounded-lg">
                    <h3 class="font-bold">Error Loading Dashboard</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.href='/'" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Start Over
                    </button>
                </div>
            `;
        }
    }
}

function updateDashboardMetrics(graph, score) {
    // Update workspace score (remove the "Workspace Score: " prefix as it's now in the label)
    document.getElementById('workspaceScore').innerText = score;

    // Calculate and update basic metrics
    const totalPages = graph.nodes.length;
    const databases = graph.nodes.filter(node => node.type === 'database');
    
    document.getElementById('totalPages').innerText = totalPages;
    document.getElementById('totalDatabases').innerText = databases.length;
    
    // For now, set other metrics to placeholder values
    // These will be updated when we implement the full metrics calculation
    document.getElementById('activePages').innerText = '0';
    document.getElementById('last30Days').innerText = '0';
    document.getElementById('last60Days').innerText = '0';
    document.getElementById('last90Days').innerText = '0';
    document.getElementById('over90Days').innerText = '0';
    document.getElementById('maxDepth').innerText = '0';
    document.getElementById('avgPagesPerLevel').innerText = '0';
    document.getElementById('totalConnections').innerText = graph.links.length;
}

function renderGraph(graph) {
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup SVG for D3
    const svg = d3
        .select('#visualization')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .call(
            d3.zoom()
                .scaleExtent([0.5, 2])
                .on('zoom', (event) => {
                    svg.attr('transform', event.transform);
                })
        )
        .append('g');

    // Render links
    svg.selectAll('line')
        .data(graph.links)
        .enter()
        .append('line')
        .attr('x1', (d) => d.source.x || 0)
        .attr('y1', (d) => d.source.y || 0)
        .attr('x2', (d) => d.target.x || 0)
        .attr('y2', (d) => d.target.y || 0)
        .attr('stroke', '#ccc');

    // Render nodes
    svg.selectAll('circle')
        .data(graph.nodes)
        .enter()
        .append('circle')
        .attr('cx', (d) => d.x || Math.random() * width)
        .attr('cy', (d) => d.y || Math.random() * height)
        .attr('r', 10)
        .attr('fill', (d) => (d.type === 'database' ? '#4CAF50' : '#2196F3'))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add labels
    svg.selectAll('text')
        .data(graph.nodes)
        .enter()
        .append('text')
        .attr('x', (d) => (d.x || Math.random() * width) + 12)
        .attr('y', (d) => (d.y || Math.random() * height) + 4)
        .text((d) => d.name || 'Unnamed')
        .style('font-size', '12px')
        .attr('fill', '#333');
}

function setupEventListeners() {
    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        // TODO: Implement export functionality
        console.log('Export functionality coming soon');
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await initializeDashboard();
    });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
        // TODO: Implement zoom in
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        // TODO: Implement zoom out
    });

    document.getElementById('resetZoom').addEventListener('click', () => {
        // TODO: Implement reset zoom
    });
}