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
    try {
        console.log('Creating metrics modal');
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        // Add a close button at the top
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
                <!-- Rest of the modal content -->
                ${createMetricsContent()}
            </div>
        `;

        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
        
        // Add close button handler
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.remove();
        }

        console.log('Metrics modal created and displayed');
    } catch (error) {
        console.error('Error showing metrics modal:', error);
    }
}

// Helper function to create metrics content
function createMetricsContent() {
    try {
        return `
            <!-- Workspace Overview -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Workspace Overview</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Overall Health', 
                        getOverallHealth(), 
                        'Composite score based on organization, activity, and maintenance'
                    )}
                    ${createMetricItem(
                        'Workspace Complexity', 
                        getComplexityScore(), 
                        'Measures how complex your workspace structure is (lower is better)'
                    )}
                </div>
            </div>

            <!-- Information Architecture -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Information Architecture</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Navigation Depth', 
                        getNavigationDepth(), 
                        'Average number of clicks to reach any page (ideal: 3-4)'
                    )}
                    ${createMetricItem(
                        'Cross-linking', 
                        getCrossLinkingScore(), 
                        'How well pages are connected across different sections'
                    )}
                    ${createMetricItem(
                        'Section Balance', 
                        getSectionBalance(), 
                        'How evenly content is distributed across main sections'
                    )}
                </div>
            </div>

            <!-- Content Management -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Content Management</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Template Coverage', 
                        getTemplateCoverage(), 
                        'Percentage of pages using standardized templates'
                    )}
                    ${createMetricItem(
                        'Database Efficiency', 
                        getDatabaseEfficiency(), 
                        'How effectively databases are structured and utilized'
                    )}
                    ${createMetricItem(
                        'Content Redundancy', 
                        getContentRedundancy(), 
                        'Potential duplicate or similar content detected'
                    )}
                </div>
            </div>

            <!-- Maintenance Metrics -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Maintenance</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Update Consistency', 
                        getUpdateConsistency(), 
                        'How regularly content is maintained across sections'
                    )}
                    ${createMetricItem(
                        'Archive Ratio', 
                        getArchiveRatio(), 
                        'Proportion of archived vs active content'
                    )}
                    ${createMetricItem(
                        'Dead Links', 
                        getDeadLinks(), 
                        'Number of broken or invalid internal links'
                    )}
                </div>
            </div>

            <!-- Collaboration Insights -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Collaboration Patterns</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Shared Access', 
                        getSharedAccessMetrics(), 
                        'How well content is shared and accessible across teams'
                    )}
                    ${createMetricItem(
                        'Update Hotspots', 
                        getUpdateHotspots(), 
                        'Areas with highest collaboration activity'
                    )}
                    ${createMetricItem(
                        'Permission Health', 
                        getPermissionHealth(), 
                        'Assessment of permission structure and security'
                    )}
                </div>
            </div>

            <!-- Best Practices Score -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">Best Practices Compliance</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${createMetricItem(
                        'Naming Conventions', 
                        getNamingScore(), 
                        'Consistency in page and database naming'
                    )}
                    ${createMetricItem(
                        'Documentation', 
                        getDocumentationScore(), 
                        'Presence and quality of workspace documentation'
                    )}
                    ${createMetricItem(
                        'Organization Score', 
                        getOrganizationScore(), 
                        'Overall adherence to workspace organization best practices'
                    )}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating metrics content:', error);
        return '<div class="text-red-500">Error loading metrics</div>';
    }
}

// Helper function to create metric items with tooltips
function createMetricItem(label, value, tooltip) {
    const displayValue = value || '0%';
    return `
        <div class="relative group">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">${label}</span>
                <span class="font-semibold">${displayValue}</span>
            </div>
            <div class="invisible group-hover:visible absolute z-50 w-64 p-2 mt-1 text-sm text-gray-600 bg-white rounded-lg shadow-lg border border-gray-200">
                ${tooltip}
            </div>
        </div>
    `;
}

// Metric calculation functions
function getHierarchyScore() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    // Calculate based on:
    // 1. Average depth (ideal: 3-5 levels)
    // 2. Branching factor (ideal: 3-7 children per parent)
    // 3. Consistency of structure
    
    const depths = nodes.map(node => calculateNodeDepth(node));
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const branchingFactors = nodes.map(node => countChildPages(node));
    const avgBranching = branchingFactors.reduce((a, b) => a + b, 0) / branchingFactors.length;
    
    let score = 100;
    
    // Penalize for too shallow or too deep
    if (avgDepth < 2) score -= 20;
    if (avgDepth > 6) score -= 15;
    
    // Penalize for too few or too many children
    if (avgBranching < 2) score -= 15;
    if (avgBranching > 8) score -= 10;
    
    return Math.max(0, Math.min(100, score)) + '%';
}

function getContentDistribution() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Count nodes at each level
    const levelCounts = new Map();
    nodes.forEach(node => {
        const depth = calculateNodeDepth(node);
        levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1);
    });
    
    // Calculate distribution evenness
    const counts = Array.from(levelCounts.values());
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    
    // Return as a ratio where 1 is perfectly even
    const evenness = min / max;
    return (evenness * 100).toFixed(1) + '%';
}

function getDatabaseIntegrationScore() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    const databases = nodes.filter(n => n.type === 'database');
    if (databases.length === 0) return 'N/A';
    
    let score = 100;
    
    // Check each database
    databases.forEach(db => {
        const connectedPages = links.filter(l => 
            l.source.id === db.id || l.target.id === db.id
        ).length;
        
        // Penalize underutilized databases
        if (connectedPages < 3) score -= 15;
        if (connectedPages === 0) score -= 25;
    });
    
    return Math.max(0, score) + '%';
}

function getActiveAreas() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Group nodes by parent and count recent updates
    const areaActivity = new Map();
    nodes.forEach(node => {
        const parentId = node.parentId || 'root';
        const isRecent = new Date(node.lastEdited) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (!areaActivity.has(parentId)) {
            areaActivity.set(parentId, { total: 0, active: 0 });
        }
        
        const stats = areaActivity.get(parentId);
        stats.total++;
        if (isRecent) stats.active++;
    });
    
    // Find most active areas
    const activeAreas = Array.from(areaActivity.entries())
        .sort((a, b) => (b[1].active / b[1].total) - (a[1].active / a[1].total))
        .slice(0, 3);
    
    return activeAreas.map(([id, stats]) => {
        const areaNode = nodes.find(n => n.id === id) || { name: 'Root' };
        return `${areaNode.name}: ${Math.round(stats.active / stats.total * 100)}%`;
    }).join(', ');
}

// Implementation of new metric calculation functions
function getOverallHealth() {
    try {
        const organization = parseFloat(getOrganizationScore()) || 0;
        const activity = getActivityScore() || 0;
        const maintenance = getMaintenanceScore() || 0;
        
        const score = (organization + activity + maintenance) / 3;
        return isNaN(score) ? '0%' : `${Math.round(score)}%`;
    } catch (error) {
        console.error('Error calculating overall health:', error);
        return '0%';
    }
}

function getComplexityScore() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    // Factors that increase complexity:
    // 1. Deep nesting
    // 2. Many cross-links
    // 3. Large number of different page types
    // 4. Inconsistent structure
    
    const maxDepth = Math.max(...nodes.map(node => calculateNodeDepth(node)));
    const avgConnections = links.length / nodes.length;
    const pageTypes = new Set(nodes.map(n => n.type)).size;
    
    let complexity = 0;
    complexity += maxDepth * 10;
    complexity += avgConnections * 5;
    complexity += pageTypes * 15;
    
    // Normalize to 0-100
    complexity = Math.min(100, complexity);
    
    return `${Math.round(complexity)}/100`;
}

function getNavigationDepth() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        
        if (!nodes.length) return '0 clicks';
        
        const depths = nodes.map(node => calculateNodeDepth(node) || 0);
        const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
        
        return isNaN(avgDepth) ? '0 clicks' : avgDepth.toFixed(1) + ' clicks';
    } catch (error) {
        console.error('Error calculating navigation depth:', error);
        return '0 clicks';
    }
}

// Add these metric calculation functions

function getActivityScore() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        
        if (!nodes.length) return 0;
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        const activeNodes = nodes.filter(node => 
            node.lastEdited && new Date(node.lastEdited) > thirtyDaysAgo
        ).length;
        
        return (activeNodes / nodes.length) * 100;
    } catch (error) {
        console.error('Error calculating activity score:', error);
        return 0;
    }
}

function getMaintenanceScore() {
    const deadLinks = getDeadLinks();
    const updateConsistency = getUpdateConsistency();
    const archiveRatio = parseFloat(getArchiveRatio());
    
    return Math.round((100 - deadLinks + updateConsistency + archiveRatio) / 3);
}

function getOrganizationScore() {
    const namingScore = parseFloat(getNamingScore());
    const docScore = parseFloat(getDocumentationScore());
    const templateScore = parseFloat(getTemplateCoverage());
    
    return Math.round((namingScore + docScore + templateScore) / 3);
}

function getCrossLinkingScore() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        const links = svg.selectAll('.link').data();
        
        if (!links.length || !nodes.length) return '0%';
        
        const crossLinks = links.filter(link => {
            const sourceType = nodes.find(n => n.id === (link.source?.id || link.source))?.type;
            const targetType = nodes.find(n => n.id === (link.target?.id || link.target))?.type;
            return sourceType && targetType && sourceType !== targetType;
        }).length;
        
        return Math.round((crossLinks / links.length) * 100) + '%';
    } catch (error) {
        console.error('Error calculating cross-linking score:', error);
        return '0%';
    }
}

function getSectionBalance() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        
        if (!nodes.length) return '0%';
        
        const sectionCounts = new Map();
        nodes.forEach(node => {
            const section = node.section || 'uncategorized';
            sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
        });
        
        const counts = Array.from(sectionCounts.values());
        if (!counts.length) return '0%';
        
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / counts.length;
        
        const balance = Math.max(0, 100 - Math.sqrt(variance));
        return Math.round(balance) + '%';
    } catch (error) {
        console.error('Error calculating section balance:', error);
        return '0%';
    }
}

function getTemplateCoverage() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        
        if (!nodes.length) return '0%';
        
        const templatedPages = nodes.filter(node => 
            node.hasTemplate || node.type === 'template'
        ).length;
        
        return Math.round((templatedPages / nodes.length) * 100) + '%';
    } catch (error) {
        console.error('Error calculating template coverage:', error);
        return '0%';
    }
}

function getDatabaseEfficiency() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    const links = svg.selectAll('.link').data();
    
    const databases = nodes.filter(n => n.type === 'database');
    if (databases.length === 0) return 'N/A';
    
    const efficiency = databases.reduce((sum, db) => {
        const connections = links.filter(l => 
            l.source.id === db.id || l.target.id === db.id
        ).length;
        return sum + (connections >= 3 ? 1 : 0);
    }, 0) / databases.length;
    
    return Math.round(efficiency * 100) + '%';
}

function getContentRedundancy() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Simple check for similar names
    const names = nodes.map(n => n.name.toLowerCase());
    const duplicates = names.filter((name, index) => 
        names.indexOf(name) !== index
    ).length;
    
    return duplicates + ' potential duplicates';
}

function getUpdateConsistency() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    const updates = nodes.map(n => new Date(n.lastEdited).getTime());
    const now = Date.now();
    const timeGaps = updates.map(u => now - u);
    
    const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
    const variance = timeGaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / timeGaps.length;
    
    // Lower variance means more consistent updates
    const consistency = Math.max(0, 100 - Math.sqrt(variance) / (24 * 60 * 60 * 1000));
    return Math.round(consistency) + '%';
}

function getArchiveRatio() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    const archivedNodes = nodes.filter(n => n.archived || n.name.toLowerCase().includes('archive')).length;
    return Math.round((archivedNodes / nodes.length) * 100) + '%';
}

function getDeadLinks() {
    const svg = d3.select('#visualization svg');
    const links = svg.selectAll('.link').data();
    
    const deadLinks = links.filter(link => 
        !link.source || !link.target || 
        !link.source.id || !link.target.id
    ).length;
    
    return deadLinks;
}

function getSharedAccessMetrics() {
    try {
        const svg = d3.select('#visualization svg');
        const nodes = svg.selectAll('.node').data();
        
        if (!nodes.length) return '0%';
        
        const sharedNodes = nodes.filter(n => 
            n.shared || (n.permissions && n.permissions.includes('shared'))
        ).length;
        
        return Math.round((sharedNodes / nodes.length) * 100) + '%';
    } catch (error) {
        console.error('Error calculating shared access metrics:', error);
        return '0%';
    }
}

function getUpdateHotspots() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    const recentUpdates = nodes.filter(n => 
        new Date(n.lastEdited) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    return recentUpdates + ' pages this week';
}

function getPermissionHealth() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Check for consistent permissions within sections
    const sectionPermissions = new Map();
    nodes.forEach(node => {
        const section = node.section || 'uncategorized';
        if (!sectionPermissions.has(section)) {
            sectionPermissions.set(section, new Set());
        }
        if (node.permissions) {
            node.permissions.forEach(p => 
                sectionPermissions.get(section).add(p)
            );
        }
    });
    
    const avgPermissions = Array.from(sectionPermissions.values())
        .reduce((sum, perms) => sum + perms.size, 0) / sectionPermissions.size;
    
    // Lower average means more consistent permissions
    const health = Math.max(0, 100 - (avgPermissions - 1) * 20);
    return Math.round(health) + '%';
}

function getNamingScore() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Check for consistent naming patterns
    const consistentNaming = nodes.filter(node => {
        const name = node.name.toLowerCase();
        return !name.includes('untitled') && 
               !name.includes('copy of') &&
               name.length > 3;
    }).length;
    
    return Math.round((consistentNaming / nodes.length) * 100) + '%';
}

function getDocumentationScore() {
    const svg = d3.select('#visualization svg');
    const nodes = svg.selectAll('.node').data();
    
    // Check for documentation pages and README files
    const docs = nodes.filter(node => 
        node.name.toLowerCase().includes('readme') ||
        node.name.toLowerCase().includes('guide') ||
        node.name.toLowerCase().includes('documentation')
    ).length;
    
    return Math.min(100, Math.round((docs / (nodes.length / 10)) * 100)) + '%';
}

// Add implementations for other new metric functions...