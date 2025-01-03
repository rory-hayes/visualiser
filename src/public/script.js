// Add at the top of the file for debugging
console.log('Script loaded');

// Add at the top of the file
const DEBUG = true;

function log(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// First, let's store the graph data globally so we can access it in our metrics
let currentGraphData = null;

function updateStatsCards(data) {
    console.log('Updating stats cards with data:', data);
    
    if (!data || !data.graph || !data.metrics) {
        console.error('Invalid data received in updateStatsCards:', data);
        return;
    }

    // Store the data globally so we can access it later if needed
    currentGraphData = data;

    const { metrics } = data;
    
    // Update workspace score
    document.getElementById('workspaceScore').textContent = 
        typeof metrics.score === 'number' ? metrics.score.toString() : '--';
    
    // Update total pages
    document.getElementById('totalPages').textContent = 
        metrics.totalPages.toString();
    
    // Update active pages
    document.getElementById('activePages').textContent = 
        metrics.activePages.toString();
    
    // Update max depth
    document.getElementById('maxDepth').textContent = 
        metrics.maxDepth.toString();
    
    // Update total connections
    document.getElementById('totalConnections').textContent = 
        metrics.totalConnections.toString();

    console.log('Stats cards updated with values:', metrics);
}

// Add at the top level of your script
window.lastReceivedData = null;

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
    try {
        const visualization = document.getElementById('visualization');
        if (!visualization) {
            throw new Error('Visualization container not found');
        }

        showLoading(visualization);

        const { generateGraph } = await import('./generateGraph.js');
        
        const response = await fetch('/api/data');
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                // Redirect to auth if token is invalid or missing
                window.location.href = '/auth';
                return;
            }
            throw new Error(errorData.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Update stats with the complete data object
        updateStatsCards(data);
        
        const graph = generateGraph(visualization, data.graph);
        if (!graph) {
            throw new Error('Failed to generate graph');
        }

        return graph;

    } catch (error) {
        console.error('Dashboard initialization error:', error);
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
                <button onclick="window.location.href='/auth'" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    Reconnect to Notion
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
    const metricsBtn = document.getElementById('metricsBtn');
    if (metricsBtn) {
        metricsBtn.addEventListener('click', () => {
            console.log('Metrics button clicked');
            showMetricsModal();
        });
    } else {
        console.error('Metrics button not found');
    }
}

function updateDashboardMetrics(graph, score) {
    try {
        const workspaceScore = calculateWorkspaceScore(graph);
        
        // Update score display with error handling
        const scoreElement = document.getElementById('workspaceScore');
        if (scoreElement) {
            scoreElement.innerText = workspaceScore.total || '0';
        }
        
        // Update metrics with error handling
        const metrics = {
            'totalPages': workspaceScore.metrics.totalPages || 0,
            'totalDatabases': workspaceScore.metrics.databaseCount || 0,
            'activePages': workspaceScore.metrics.activePages || 0,
            'maxDepth': calculateMaxDepth(graph) || 0,
            'totalConnections': (graph.links || []).length || 0
        };
        
        // Update each metric element
        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = value;
            }
        });
        
        // Update database metrics
        updateDatabaseMetrics(graph);
        
    } catch (error) {
        console.error('Error updating dashboard metrics:', error);
        // Set default values if there's an error
        const defaultValue = '0';
        ['workspaceScore', 'totalPages', 'totalDatabases', 'activePages', 
         'maxDepth', 'totalConnections'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = defaultValue;
            }
        });
    }
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

function calculateMaxDepth(workspace) {
    try {
        if (!workspace?.nodes || !workspace?.links) return 0;
        
        const depths = workspace.nodes.map(node => {
            return calculateNodeDepth(node, workspace.links);
        });
        
        return Math.max(...depths, 0);
    } catch (error) {
        console.error('Error calculating max depth:', error);
        return 0;
    }
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
    try {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center pb-3">
                    <h3 class="text-xl font-bold">Workspace Metrics</h3>
                    <button class="modal-close text-gray-400 hover:text-gray-500">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="mt-4 space-y-6">
                    <!-- Content Structure -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">Content Structure</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span>Total Pages</span>
                                <span>${document.getElementById('totalPages').innerText}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Total Databases</span>
                                <span>${document.getElementById('totalDatabases').innerText}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Max Depth</span>
                                <span>${document.getElementById('maxDepth').innerText}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Metrics -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">Activity</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span>Active Pages (30 days)</span>
                                <span>${document.getElementById('activePages').innerText}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Pages Updated (90+ days)</span>
                                <span>${document.getElementById('over90Days').innerText}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Organization -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">Organization</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span>Workspace Score</span>
                                <span>${document.getElementById('workspaceScore').innerText}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Total Connections</span>
                                <span>${document.getElementById('totalConnections').innerText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Close button handler
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.remove();
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error showing metrics modal:', error);
    }
}

function calculateWorkspaceScore(workspaceData) {
    const weights = {
        structure: 0.40,    // 40% - Organization and hierarchy
        activity: 0.30,     // 30% - Page activity and maintenance
        connectivity: 0.30  // 30% - Inter-page connections
    };

    // Calculate component scores
    const structureScore = calculateStructureScore(workspaceData);
    const activityScore = calculateActivityScore(workspaceData);
    const connectivityScore = calculateConnectivityScore(workspaceData);

    // Calculate final score
    const finalScore = Math.round(
        (structureScore * weights.structure) +
        (activityScore * weights.activity) +
        (connectivityScore * weights.connectivity)
    );

    return {
        total: finalScore,
        breakdown: {
            structure: Math.round(structureScore),
            activity: Math.round(activityScore),
            connectivity: Math.round(connectivityScore)
        },
        metrics: {
            totalPages: workspaceData.nodes.length,
            maxDepth: calculateMaxDepth(workspaceData),
            activePages: countActivePages(workspaceData),
            databaseCount: countDatabases(workspaceData)
        },
        suggestions: generateWorkspaceSuggestions({
            structureScore,
            activityScore,
            connectivityScore
        })
    };
}

function calculateStructureScore(workspace) {
    const depthScore = calculateDepthBalance(workspace);
    const rootScore = calculateRootStructure(workspace);
    const dbScore = calculateDatabaseRatio(workspace);
    
    return (depthScore + rootScore + dbScore) / 3;
}

function calculateDepthBalance(workspace) {
    const depths = workspace.nodes.map(node => calculateNodeDepth(node));
    const maxDepth = Math.max(...depths);
    
    // Ideal depth: 3-5 levels
    if (maxDepth >= 3 && maxDepth <= 5) return 100;
    return Math.max(0, 100 - Math.abs(maxDepth - 4) * 15);
}

function calculateRootStructure(workspace) {
    const rootPages = workspace.nodes.filter(n => 
        !workspace.links.some(l => l.target.id === n.id)
    );
    // Ideal: 3-7 root pages
    return Math.max(0, 100 - Math.abs(rootPages.length - 5) * 10);
}

function calculateDatabaseRatio(workspace) {
    const dbCount = workspace.nodes.filter(n => n.type === 'database').length;
    const totalCount = workspace.nodes.length;
    const ratio = dbCount / totalCount;
    // Ideal ratio: 10-25% databases
    return Math.max(0, 100 - Math.abs(ratio - 0.175) * 300);
}

function calculateActivityScore(workspace) {
    const recentEditsScore = calculateRecentEdits(workspace);
    const archiveScore = calculateArchiveStatus(workspace);
    
    return (recentEditsScore + archiveScore) / 2;
}

function calculateRecentEdits(workspace) {
    const now = new Date();
    return workspace.nodes.reduce((score, node) => {
        if (!node.lastEdited) return score;
        const daysSinceEdit = (now - new Date(node.lastEdited)) / (1000 * 60 * 60 * 24);
        if (daysSinceEdit <= 7) return score + 1;
        if (daysSinceEdit <= 30) return score + 0.5;
        if (daysSinceEdit <= 90) return score + 0.25;
        return score;
    }, 0) / workspace.nodes.length * 100;
}

function calculateArchiveStatus(workspace) {
    const archivedCount = workspace.nodes.filter(n => n.archived).length;
    const ratio = archivedCount / workspace.nodes.length;
    // Ideal archive ratio: 5-15%
    return Math.max(0, 100 - Math.abs(ratio - 0.1) * 200);
}

function calculateConnectivityScore(workspace) {
    const linkScore = calculatePageLinks(workspace);
    const relationScore = calculateDatabaseRelations(workspace);
    
    return (linkScore + relationScore) / 2;
}

function calculatePageLinks(workspace) {
    return workspace.nodes.reduce((score, node) => {
        const linkCount = workspace.links.filter(l => 
            l.source.id === node.id || l.target.id === node.id
        ).length;
        if (linkCount >= 2) return score + 1;
        if (linkCount >= 1) return score + 0.5;
        return score;
    }, 0) / workspace.nodes.length * 100;
}

function calculateDatabaseRelations(workspace) {
    const databases = workspace.nodes.filter(n => n.type === 'database');
    if (databases.length === 0) return 0;
    
    return databases.reduce((score, db) => {
        const hasRelations = workspace.links.some(l => 
            l.source.id === db.id || l.target.id === db.id
        );
        return score + (hasRelations ? 1 : 0);
    }, 0) / databases.length * 100;
}

function generateWorkspaceSuggestions({ structureScore, activityScore, connectivityScore }) {
    const suggestions = [];
    
    if (structureScore < 70) {
        suggestions.push(
            'Consider reorganizing your workspace hierarchy to maintain 3-5 levels of depth',
            'Aim for 3-7 top-level pages for better organization',
            'Review your database to page ratio (ideal: 10-25% databases)'
        );
    }
    
    if (activityScore < 70) {
        suggestions.push(
            'Regular updates help maintain workspace relevance',
            'Consider archiving outdated content (aim for 5-15% archived)',
            'Review and update pages that have not been modified in over 90 days'
        );
    }
    
    if (connectivityScore < 70) {
        suggestions.push(
            'Add more connections between related pages',
            'Utilize database relations to link related content',
            'Create index pages to improve navigation'
        );
    }
    
    return suggestions;
}

// Add these helper functions for workspace metrics

function countActivePages(workspace) {
    try {
        if (!workspace?.nodes) return 0;
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        return workspace.nodes.filter(node => 
            node.lastEdited && new Date(node.lastEdited) > thirtyDaysAgo
        ).length;
    } catch (error) {
        console.error('Error counting active pages:', error);
        return 0;
    }
}

function countDatabases(workspace) {
    try {
        if (!workspace?.nodes) return 0;
        
        return workspace.nodes.filter(node => 
            node.type === 'database'
        ).length;
    } catch (error) {
        console.error('Error counting databases:', error);
        return 0;
    }
}

// Add error handling to existing functions
function calculateNodeDepth(node, links, visited = new Set()) {
    try {
        if (!node || !links || visited.has(node.id)) return 0;
        visited.add(node.id);
        
        const parentLink = links.find(link => 
            (link.target.id === node.id) || (link.target === node.id)
        );
        
        if (!parentLink) return 0;
        
        const parentNode = {
            id: parentLink.source.id || parentLink.source
        };
        
        return 1 + calculateNodeDepth(parentNode, links, visited);
    } catch (error) {
        console.error('Error calculating node depth:', error);
        return 0;
    }
}

// Add implementations for other new metric functions...

fetch('/api/workspace-data')
    .then(response => response.json())
    .then(data => {
        window.lastReceivedData = data;  // Store the data
        updateStatsCards(data);
        // Your existing visualization code...
    })
    .catch(error => {
        console.error('Error fetching workspace data:', error);
    });

// Initialize search and filter functionality
function initializeSearchAndFilters() {
    const searchInput = document.getElementById('pageSearch');
    const filterButton = document.querySelector('#filterDropdown button');
    const filterPanel = document.getElementById('filterControls');
    const filters = document.querySelectorAll('select.filter-control');

    // Toggle filter panel
    filterButton?.addEventListener('click', () => {
        filterPanel.classList.toggle('hidden');
    });

    // Close filter panel when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#filterDropdown')) {
            filterPanel.classList.add('hidden');
        }
    });

    // Search functionality with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            filterNodes(searchTerm);
        }, 300);
    });

    // Filter change handlers
    filters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

function filterNodes(searchTerm) {
    if (!graph) return;

    const nodes = graph.nodes();
    nodes.forEach(node => {
        const title = node.title?.toLowerCase() || '';
        const matches = title.includes(searchTerm);
        node.hidden = searchTerm && !matches;
    });

    updateGraphVisibility();
}

function applyFilters() {
    if (!graph) return;

    const typeFilter = document.getElementById('typeFilter').value;
    const activityFilter = document.getElementById('activityFilter').value;
    const depthFilter = document.getElementById('depthFilter').value;
    const connectionsFilter = document.getElementById('connectionsFilter').value;

    const nodes = graph.nodes();
    nodes.forEach(node => {
        let visible = true;

        // Type filter
        if (typeFilter && node.type !== typeFilter) {
            visible = false;
        }

        // Activity filter
        if (visible && activityFilter) {
            const lastEdited = new Date(node.lastEdited);
            const now = new Date();
            const daysDiff = (now - lastEdited) / (1000 * 60 * 60 * 24);

            switch (activityFilter) {
                case 'recent':
                    visible = daysDiff <= 7;
                    break;
                case 'active':
                    visible = daysDiff <= 30;
                    break;
                case 'stale':
                    visible = daysDiff > 90;
                    break;
            }
        }

        // Depth filter
        if (visible && depthFilter) {
            const depth = node.depth || 0;
            switch (depthFilter) {
                case 'root':
                    visible = depth === 0;
                    break;
                case 'shallow':
                    visible = depth <= 2;
                    break;
                case 'deep':
                    visible = depth > 4;
                    break;
            }
        }

        // Connections filter
        if (visible && connectionsFilter) {
            const connectionCount = (node.incomingLinks?.length || 0) + (node.outgoingLinks?.length || 0);
            switch (connectionsFilter) {
                case 'none':
                    visible = connectionCount === 0;
                    break;
                case 'few':
                    visible = connectionCount <= 2;
                    break;
                case 'many':
                    visible = connectionCount > 5;
                    break;
            }
        }

        node.hidden = !visible;
    });

    updateGraphVisibility();
}

function updateGraphVisibility() {
    // Update graph visualization based on hidden nodes
    // Implementation depends on your graph visualization library
    // This is a placeholder for the actual implementation
    graph.refresh();
}