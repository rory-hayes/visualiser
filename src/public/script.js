// Add at the top of the file for debugging
console.log('Script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // First, determine which page we're on
    const isLandingPage = window.location.pathname === '/';
    console.log('Current path:', window.location.pathname);
    console.log('Is landing page:', isLandingPage);

    if (isLandingPage) {
        // Landing page logic
        const getStartedButton = document.getElementById('getStarted');
        console.log('Get Started button found:', !!getStartedButton);

        if (getStartedButton) {
            getStartedButton.addEventListener('click', () => {
                console.log('Get Started clicked, redirecting to auth...');
                window.location.href = '/auth';
            });
        }
    } else {
        // Dashboard page logic
        initializeDashboard();
    }
});

let graphCleanup;

async function initializeDashboard() {
    const visualization = document.getElementById('visualization');
    if (!visualization) {
        console.error('Visualization container not found');
        return;
    }

    // Show loading state
    showLoading(visualization);

    try {
        // Update the import path
        const { generateGraph } = await import('./generateGraph.js');
        console.log('Successfully loaded generateGraph');
        
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
        graphCleanup = graph.cleanup;

        // Update all metrics
        updateDashboardMetrics(data.graph, data.score);

        // Setup zoom control buttons
        setupZoomControls(graph);

        // Setup event listeners
        setupEventListeners(graph);

        // Enhance visualization
        enhanceVisualization(graph);

    } catch (error) {
        if (graphCleanup) {
            graphCleanup();
        }
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

    // Debug layout button
    document.getElementById('debugLayout')?.addEventListener('click', () => {
        console.log('Current graph state:', {
            layoutSelect: document.getElementById('layoutSelect')?.value,
            visualization: document.getElementById('visualization'),
            hasGraph: !!document.querySelector('#visualization svg'),
            svgContent: document.querySelector('#visualization svg g')?.children?.length
        });
    });

    // Analysis button
    document.getElementById('analysisBtn').addEventListener('click', () => {
        showAnalysisModal();
    });

    // Metrics button
    document.getElementById('metricsBtn').addEventListener('click', () => {
        showMetricsModal();
    });
}

function updateDashboardMetrics(graph, score) {
    // Update workspace score
    document.getElementById('workspaceScore').innerText = score;

    // Basic metrics
    const totalPages = graph.metadata.totalPages;
    const totalDatabases = graph.metadata.totalDatabases;
    
    document.getElementById('totalPages').innerText = totalPages;
    document.getElementById('totalDatabases').innerText = totalDatabases;
    
    // Activity metrics
    const now = new Date();
    const lastEditTimes = graph.metadata.lastEditTimes.map(t => new Date(t));
    
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const activePages = lastEditTimes.filter(date => date > thirtyDaysAgo).length;
    
    document.getElementById('activePages').innerText = activePages;
    document.getElementById('last30Days').innerText = activePages;
    document.getElementById('last60Days').innerText = lastEditTimes.filter(date => date > sixtyDaysAgo).length;
    document.getElementById('last90Days').innerText = lastEditTimes.filter(date => date > ninetyDaysAgo).length;
    document.getElementById('over90Days').innerText = lastEditTimes.filter(date => date <= ninetyDaysAgo).length;

    // Structure metrics with additional detail
    const maxDepth = calculateMaxDepth(graph);
    const avgPagesPerLevel = calculateAvgPagesPerLevel(graph);
    
    document.getElementById('maxDepth').innerText = maxDepth;
    document.getElementById('avgPagesPerLevel').innerHTML = `
        <span class="font-semibold">${avgPagesPerLevel}</span>
        <span class="text-xs text-gray-500 ml-1">pages/level</span>
    `;
    document.getElementById('totalConnections').innerText = graph.links.length;

    // Add hover tooltip for structure stats
    const structureStats = document.querySelector('.dashboard-card:last-child');
    if (structureStats) {
        structureStats.setAttribute('title', 
            `Workspace Structure Details:\n` +
            `• Maximum depth: ${maxDepth} levels\n` +
            `• Average pages per level: ${avgPagesPerLevel}\n` +
            `• Total connections: ${graph.links.length}`
        );
    }

    // Update database metrics
    updateDatabaseMetrics(graph);
}

function updateDatabaseMetrics(graph) {
    const databaseMetrics = document.getElementById('databaseMetrics');
    const databases = graph.nodes.filter(n => n.type === 'database');
    
    const databaseStats = databases.map(db => {
        const childPages = graph.links.filter(link => link.source.id === db.id || link.source === db.id).length;
        return {
            name: db.name,
            pageCount: childPages
        };
    });

    databaseMetrics.innerHTML = databaseStats
        .sort((a, b) => b.pageCount - a.pageCount) // Sort by page count
        .map(db => `
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">${db.name}</span>
                <span class="font-semibold">${db.pageCount} pages</span>
            </div>
        `).join('');
}

function calculateMaxDepth(graph) {
    const getNodeDepth = (nodeId, visited = new Set()) => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        
        const childLinks = graph.links.filter(link => 
            (link.source.id === nodeId || link.source === nodeId)
        );
        
        if (childLinks.length === 0) return 1;
        
        const childDepths = childLinks.map(link => 
            getNodeDepth(link.target.id || link.target, visited)
        );
        
        return 1 + Math.max(...childDepths);
    };

    const rootNodes = graph.nodes.filter(node => 
        node.type === 'workspace' || 
        !graph.links.some(link => link.target.id === node.id || link.target === node.id)
    );

    const depths = rootNodes.map(node => getNodeDepth(node.id));
    return Math.max(...depths);
}

function calculateAvgPagesPerLevel(graph) {
    const levelCounts = new Map();
    const nodeDepths = new Map();
    
    // Helper function to get node depth
    const getNodeDepth = (nodeId, visited = new Set()) => {
        if (nodeDepths.has(nodeId)) return nodeDepths.get(nodeId);
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);

        // Find parent link
        const parentLink = graph.links.find(link => link.target === nodeId || link.target.id === nodeId);
        if (!parentLink) return 0;

        const parentId = parentLink.source.id || parentLink.source;
        const parentDepth = getNodeDepth(parentId, visited);
        const depth = parentDepth + 1;
        nodeDepths.set(nodeId, depth);
        return depth;
    };

    // Calculate depth for each node
    graph.nodes.forEach(node => {
        if (node.type === 'workspace') {
            nodeDepths.set(node.id, 0); // Root level
            return;
        }

        const depth = getNodeDepth(node.id);
        levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1);
    });

    // Calculate average
    const levels = Array.from(levelCounts.entries())
        .sort(([a], [b]) => a - b); // Sort by depth

    console.log('Level distribution:', levels.map(([depth, count]) => ({
        depth,
        count,
        nodes: graph.nodes.filter(n => nodeDepths.get(n.id) === depth)
            .map(n => n.name)
    })));

    if (levels.length === 0) return '0';

    const totalNodes = levels.reduce((sum, [_, count]) => sum + count, 0);
    const avgNodesPerLevel = totalNodes / levels.length;

    return avgNodesPerLevel.toFixed(1);
}

function setupSearchAndFilter() {
    const searchInput = document.getElementById('pageSearch');
    const filterControls = document.getElementById('filterControls');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterNodes(searchTerm, getActiveFilters());
        });
    }

    // Setup filter listeners
    document.querySelectorAll('.filter-control').forEach(control => {
        control.addEventListener('change', () => {
            filterNodes(searchInput?.value.toLowerCase() || '', getActiveFilters());
        });
    });
}

function getActiveFilters() {
    return {
        type: document.getElementById('typeFilter')?.value,
        activity: document.getElementById('activityFilter')?.value,
        depth: document.getElementById('depthFilter')?.value,
        connections: document.getElementById('connectionsFilter')?.value
    };
}

function filterNodes(searchTerm, filters) {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node');
    const links = svg.selectAll('.link');

    nodes.style('opacity', node => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm);
        const matchesType = !filters.type || node.type === filters.type;
        const matchesActivity = !filters.activity || checkActivityMatch(node, filters.activity);
        const matchesDepth = !filters.depth || checkDepthMatch(node, filters.depth);
        const matchesConnections = !filters.connections || checkConnectionsMatch(node, filters.connections);

        return (matchesSearch && matchesType && matchesActivity && 
                matchesDepth && matchesConnections) ? 1 : 0.2;
    });

    links.style('opacity', link => {
        const sourceVisible = nodes.filter(n => n.id === link.source.id).style('opacity') === '1';
        const targetVisible = nodes.filter(n => n.id === link.target.id).style('opacity') === '1';
        return (sourceVisible && targetVisible) ? 1 : 0.1;
    });
}

function checkActivityMatch(node, activityFilter) {
    const lastEdit = new Date(node.lastEdited);
    const now = new Date();
    const daysSinceEdit = (now - lastEdit) / (1000 * 60 * 60 * 24);

    switch (activityFilter) {
        case 'recent': return daysSinceEdit <= 7;
        case 'active': return daysSinceEdit <= 30;
        case 'stale': return daysSinceEdit > 90;
        default: return true;
    }
}

function checkDepthMatch(node, depthFilter) {
    const depth = calculateNodeDepth(node);
    switch (depthFilter) {
        case 'root': return depth === 0;
        case 'shallow': return depth <= 2;
        case 'deep': return depth > 4;
        default: return true;
    }
}

function checkConnectionsMatch(node, connectionsFilter) {
    const connectionCount = countNodeConnections(node);
    switch (connectionsFilter) {
        case 'none': return connectionCount === 0;
        case 'few': return connectionCount <= 2;
        case 'many': return connectionCount > 5;
        default: return true;
    }
}

function enhanceVisualization(graph) {
    // Apply color coding first
    applyColorCoding(graph);
    
    // Setup clustering force
    const simulation = d3.select('#visualization svg').datum();
    if (simulation && simulation.force) {
        const clusterForce = createClusters(graph.nodes);
        simulation
            .force('cluster', clusterForce)
            .alpha(0.3)
            .restart();
    }
    
    // Enhance tooltips
    setupEnhancedTooltips();
    
    // Setup search and filter
    setupSearchAndFilter();
}

function createClusters(nodes) {
    // Group nodes by their parent or type
    const clusters = d3.group(nodes, d => d.parentId || d.type || 'unclustered');
    
    // Calculate cluster centers
    const width = document.getElementById('visualization').clientWidth;
    const height = document.getElementById('visualization').clientHeight;
    
    const clusterCenters = new Map();
    let angle = 0;
    const increment = (2 * Math.PI) / clusters.size;
    const radius = Math.min(width, height) / 3;
    
    for (const [key, nodes] of clusters) {
        clusterCenters.set(key, {
            x: width/2 + radius * Math.cos(angle),
            y: height/2 + radius * Math.sin(angle),
            nodes: nodes
        });
        angle += increment;
    }
    
    // Add clustering force to the simulation
    const forceCluster = (alpha) => {
        for (const node of nodes) {
            const cluster = clusterCenters.get(node.parentId || node.type || 'unclustered');
            if (cluster) {
                node.vx = (cluster.x - node.x) * alpha * 0.3;
                node.vy = (cluster.y - node.y) * alpha * 0.3;
            }
        }
    };
    
    return forceCluster;
}

function setupEnhancedTooltips() {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'graph-tooltip')
        .style('opacity', 0);

    d3.selectAll('.node')
        .on('mouseover', (event, d) => {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            
            tooltip.html(`
                <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-bold">${d.name}</h3>
                    <p class="text-sm text-gray-600">Type: ${d.type}</p>
                    <p class="text-sm text-gray-600">Last edited: ${formatDate(d.lastEdited)}</p>
                    <p class="text-sm text-gray-600">Child pages: ${countChildPages(d)}</p>
                </div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
}

function applyColorCoding(graph) {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node');
    
    // Color scale for different types
    const typeColors = {
        workspace: '#4f46e5', // indigo
        database: '#059669', // emerald
        page: '#2563eb',     // blue
        template: '#7c3aed'  // violet
    };

    // Color scale for activity
    const activityColorScale = d3.scaleSequential()
        .domain([0, 90]) // days
        .interpolator(d3.interpolateRgb('#22c55e', '#ef4444')); // green to red

    nodes.style('fill', node => {
        // First priority: node type
        if (typeColors[node.type]) {
            return typeColors[node.type];
        }
        
        // Second priority: activity level
        const daysSinceEdit = (new Date() - new Date(node.lastEdited)) / (1000 * 60 * 60 * 24);
        return activityColorScale(Math.min(daysSinceEdit, 90));
    });
}

// Helper functions for node metrics
function countNodeConnections(node) {
    const svg = d3.select('#visualization svg');
    const links = svg.selectAll('.link').data();
    return links.filter(link => 
        link.source.id === node.id || 
        link.target.id === node.id
    ).length;
}

function countChildPages(node) {
    const svg = d3.select('#visualization svg');
    const links = svg.selectAll('.link').data();
    return links.filter(link => 
        link.source.id === node.id
    ).length;
}

function calculateNodeDepth(node) {
    const svg = d3.select('#visualization svg');
    const links = svg.selectAll('.link').data();
    let depth = 0;
    let currentNode = node;
    
    while (true) {
        const parentLink = links.find(link => 
            link.target.id === currentNode.id
        );
        
        if (!parentLink) break;
        
        currentNode = parentLink.source;
        depth++;
    }
    
    return depth;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAnalysisModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center pb-3">
                <h3 class="text-xl font-bold">Workspace Analysis</h3>
                <button class="modal-close text-gray-400 hover:text-gray-500">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="mt-4">
                <h4 class="font-semibold text-gray-800 mb-2">Structure Analysis</h4>
                <ul class="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Deep hierarchies detected: ${getDeepHierarchies()}</li>
                    <li>Orphaned pages: ${getOrphanedPages()}</li>
                    <li>Underutilized databases: ${getUnderutilizedDatabases()}</li>
                </ul>
                
                <h4 class="font-semibold text-gray-800 mt-6 mb-2">Recommendations</h4>
                <ul class="list-disc pl-5 space-y-2 text-gray-600">
                    ${generateRecommendations().map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = () => modal.remove();
}

function showMetricsModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center pb-3">
                <h3 class="text-xl font-bold">Workspace Metrics</h3>
                <button class="modal-close text-gray-400 hover:text-gray-500">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">Activity Metrics</h4>
                    <div class="space-y-2">
                        <p>Active pages (30 days): ${getActivePages()}</p>
                        <p>Stale pages (90+ days): ${getStalePages()}</p>
                        <p>Average updates per week: ${getUpdatesPerWeek()}</p>
                    </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">Structure Metrics</h4>
                    <div class="space-y-2">
                        <p>Average depth: ${getAverageDepth()}</p>
                        <p>Connection density: ${getConnectionDensity()}</p>
                        <p>Database utilization: ${getDatabaseUtilization()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = () => modal.remove();
}

// Add helper functions for analysis and metrics
// These functions should be implemented based on your data structure
function getDeepHierarchies() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    // Track depth of each node
    const nodeDepths = new Map();
    const deepPaths = [];
    const DEPTH_THRESHOLD = 5; // Consider hierarchies deeper than 5 levels as "deep"
    
    function calculateNodeDepth(node, visited = new Set()) {
        if (nodeDepths.has(node.id)) return nodeDepths.get(node.id);
        if (visited.has(node.id)) return 0;
        
        visited.add(node.id);
        
        // Find parent link
        const parentLink = links.find(link => 
            (link.target.id || link.target) === node.id
        );
        
        if (!parentLink) {
            nodeDepths.set(node.id, 0);
            return 0;
        }
        
        const parentNode = nodes.find(n => 
            n.id === (parentLink.source.id || parentLink.source)
        );
        const parentDepth = calculateNodeDepth(parentNode, visited);
        const depth = parentDepth + 1;
        nodeDepths.set(node.id, depth);
        
        // Track deep paths
        if (depth >= DEPTH_THRESHOLD) {
            let currentNode = node;
            const path = [currentNode.name];
            
            while (currentNode) {
                const parentLink = links.find(link => 
                    (link.target.id || link.target) === currentNode.id
                );
                if (!parentLink) break;
                
                currentNode = nodes.find(n => 
                    n.id === (parentLink.source.id || parentLink.source)
                );
                if (currentNode) {
                    path.unshift(currentNode.name);
                }
            }
            
            deepPaths.push(path);
        }
        
        return depth;
    }
    
    // Calculate depths for all nodes
    nodes.forEach(node => calculateNodeDepth(node));
    
    // Get unique deep paths
    const uniqueDeepPaths = Array.from(new Set(
        deepPaths.map(path => path.join(' → '))
    )).map(pathString => pathString.split(' → '));
    
    if (uniqueDeepPaths.length === 0) {
        return 'No deep hierarchies detected';
    }
    
    return `${uniqueDeepPaths.length} deep paths found:<br>` +
        uniqueDeepPaths.map(path => 
            `• ${path.join(' → ')}`
        ).join('<br>');
}

function getOrphanedPages() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    const orphanedNodes = nodes.filter(node => {
        // Skip workspace node
        if (node.type === 'workspace') return false;
        
        // Check if node has any connections
        const hasConnections = links.some(link => 
            (link.source.id || link.source) === node.id || 
            (link.target.id || link.target) === node.id
        );
        
        return !hasConnections;
    });
    
    if (orphanedNodes.length === 0) {
        return 'No orphaned pages found';
    }
    
    return `${orphanedNodes.length} orphaned pages found:<br>` +
        orphanedNodes.map(node => 
            `• ${node.name} (${node.type})`
        ).join('<br>');
}

function getUnderutilizedDatabases() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    const databases = nodes.filter(node => node.type === 'database');
    const underutilizedDbs = databases.filter(db => {
        // Count child pages
        const childCount = links.filter(link => 
            (link.source.id || link.source) === db.id
        ).length;
        
        // Consider databases with less than 3 child pages as underutilized
        return childCount < 3;
    });
    
    if (underutilizedDbs.length === 0) {
        return 'No underutilized databases found';
    }
    
    return `${underutilizedDbs.length} underutilized databases found:<br>` +
        underutilizedDbs.map(db => {
            const childCount = links.filter(link => 
                (link.source.id || link.source) === db.id
            ).length;
            return `• ${db.name} (${childCount} pages)`;
        }).join('<br>');
}

function generateRecommendations() {
    const recommendations = [];
    
    // Deep hierarchies recommendations
    const deepHierarchies = getDeepHierarchies();
    if (deepHierarchies.includes('deep paths found')) {
        recommendations.push(
            'Consider flattening deep hierarchies to improve navigation',
            'Create index pages to better organize deep content'
        );
    }
    
    // Orphaned pages recommendations
    const orphanedPages = getOrphanedPages();
    if (orphanedPages.includes('orphaned pages found')) {
        recommendations.push(
            'Connect or archive orphaned pages',
            'Create a dedicated archive section for unused content'
        );
    }
    
    // Database recommendations
    const underutilizedDbs = getUnderutilizedDatabases();
    if (underutilizedDbs.includes('underutilized databases found')) {
        recommendations.push(
            'Consider merging underutilized databases',
            'Review database structure to improve usage'
        );
    }
    
    // Add general recommendations
    recommendations.push(
        'Regularly review and update page connections',
        'Use templates for consistent page structure',
        'Consider implementing a tagging system'
    );
    
    return recommendations;
}