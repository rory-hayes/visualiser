// Constants
const HEX_PROJECT_ID = '21c6c24a-60e8-487c-b03a-1f04dda4f918';
const HEX_API_URL = 'https://app.hex.tech/api/v1';

// DOM Elements
const workspaceIdsInput = document.getElementById('workspaceIds');
const generateBtn = document.getElementById('generateBtn');
const statusSection = document.getElementById('statusSection');
const statusSpinner = document.getElementById('statusSpinner');
const statusText = document.getElementById('statusText');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');

// Event Source for receiving results
let eventSource = null;

// Event Listeners
generateBtn.addEventListener('click', handleGenerateReport);

async function handleGenerateReport() {
    try {
        const workspaceIds = workspaceIdsInput.value.split(',').map(id => id.trim()).filter(Boolean);
        
        if (workspaceIds.length === 0) {
            alert('Please enter at least one workspace ID');
            return;
        }

        // Show status section and spinner
        showStatus('Initiating report generation...', true);
        
        // Process each workspace ID
        for (const workspaceId of workspaceIds) {
            await processWorkspace(workspaceId);
        }

    } catch (error) {
        console.error('Error generating report:', error);
        showStatus(`Error: ${error.message}`, false);
    }
}

async function processWorkspace(workspaceId) {
    try {
        // Trigger Hex report
        showStatus(`Triggering report for workspace ${workspaceId}...`, true);
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                _input_text: workspaceId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to trigger report');
        }

        const data = await response.json();
        
        // Send data to server for logging
        await fetch('/api/log-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'generate-report',
                data: data
            })
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to trigger report');
        }

        showStatus(`Report triggered for workspace ${workspaceId}. Waiting for results...`, true);
        
        // Start listening for results
        listenForResults();

    } catch (error) {
        console.error('Error processing workspace:', error);
        showStatus(`Error processing workspace ${workspaceId}: ${error.message}`, false);
    }
}

function listenForResults() {
    // Close any existing event source
    if (eventSource) {
        eventSource.close();
    }

    // Create new event source
    eventSource = new EventSource('/api/hex-results/stream');

    eventSource.onmessage = (event) => {
        try {
            console.log('Raw event data received:', event.data);
            
            const data = JSON.parse(event.data);
            console.log('Parsed event data:', data);
            
            if (data.type === 'connected') {
                console.log('Connected to results stream');
                return;
            }

            if (data.success && data.data) {
                console.log('Processing successful data:', {
                    success: data.success,
                    hasData: !!data.data,
                    dataStructure: {
                        hasDataframe2: data.data?.data?.dataframe_2 ? 'yes' : 'no',
                        hasDataframe3: data.data?.data?.dataframe_3 ? 'yes' : 'no',
                        dataframe2Length: data.data?.data?.dataframe_2?.length,
                        dataframe3Length: data.data?.data?.dataframe_3?.length
                    }
                });

                // Send final results to server for logging
                fetch('/api/log-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'final-results',
                        data: data.data
                    })
                }).catch(error => {
                    console.error('Error logging final results:', error);
                });
                
                // Hide spinner and update status
                showStatus('Results received!', false);
                
                try {
                    // Display results
                    displayResults(data.data);
                } catch (displayError) {
                    console.error('Error in displayResults:', displayError);
                    console.error('Data structure that caused error:', JSON.stringify(data.data, null, 2));
                    showStatus('Error displaying results. Check console for details.', false);
                }
                
                // Close event source
                eventSource.close();
            } else {
                console.warn('Received data without success or data property:', data);
                showStatus('Received incomplete data. Please try again.', false);
                eventSource.close();
            }
        } catch (error) {
            console.error('Error processing event data:', error);
            console.error('Raw event data that caused error:', event.data);
            showStatus('Error processing results. Please try again.', false);
            eventSource.close();
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        console.error('EventSource readyState:', eventSource.readyState);
        showStatus('Error receiving results. Please try again.', false);
        eventSource.close();
    };
}

function displayResults(data) {
    try {
        console.log('Starting displayResults with data:', {
            hasData: !!data,
            dataType: typeof data,
            dataStructure: data ? Object.keys(data) : null,
            rawData: data
        });

        resultsSection.classList.remove('hidden');
        
        // Extract the dataframes with proper error handling
        let graphData, insightsData, keyInsightsData;
        
        if (data && typeof data === 'object') {
            // Try different possible data structures
            if (data.data) {
                graphData = data.data.dataframe_2;
                insightsData = data.data.dataframe_3;
                keyInsightsData = data.data.dataframe_4;
            } else {
                graphData = data.dataframe_2;
                insightsData = data.dataframe_3;
                keyInsightsData = data.dataframe_4;
            }
        }

        // Validate graphData
        if (!Array.isArray(graphData) || graphData.length === 0) {
            console.error('Invalid or empty graphData:', graphData);
            showStatus('Error: Invalid graph data received', false);
            return;
        }

        // Store the extracted data for later use
        window._lastGraphData = {
            graphData,
            insightsData,
            keyInsightsData
        };

        // Clear any existing graph
        const container = document.getElementById('graph-container');
        if (container) {
            container.innerHTML = '';
        }

        // Reset graph initialization flag
        window._graphInitialized = false;

        resultsContent.innerHTML = formatResults(graphData, insightsData, keyInsightsData);
        
        // Wait for next frame to ensure container is rendered
        requestAnimationFrame(() => {
            try {
                // Scroll results into view
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Initialize graph with delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        initializeGraph(graphData);
                        window._graphInitialized = true;
                        
                        // Force a resize event to ensure proper dimensions
                        window.dispatchEvent(new Event('resize'));
                    } catch (graphError) {
                        console.error('Error initializing graph:', graphError);
                        showStatus('Error initializing graph visualization', false);
                    }
                }, 500);
            } catch (scrollError) {
                console.error('Error in scroll/animation handling:', scrollError);
            }
        });
    } catch (error) {
        console.error('Error in displayResults:', error);
        console.error('Data that caused error:', JSON.stringify(data, null, 2));
        showStatus('Error displaying results: ' + error.message, false);
    }
}

function formatResults(graphData, insightsData, keyInsightsData) {
    if (!Array.isArray(graphData) || graphData.length === 0) {
        return '<p class="text-gray-500">No results available</p>';
    }

    // Calculate graph insights
    const insights = {
        totalPages: graphData.length,
        typeDistribution: {},
        depthDistribution: {},
        pageDepthDistribution: {},
        collections: graphData.filter(item => item.TYPE === 'collection').length,
        collectionViews: graphData.filter(item => item.TYPE === 'collection_view_page').length,
        maxDepth: Math.max(...graphData.map(item => item.DEPTH)),
        maxPageDepth: Math.max(...graphData.map(item => item.PAGE_DEPTH)),
        rootPages: graphData.filter(item => item.DEPTH === 0).length
    };

    // Calculate distributions
    graphData.forEach(item => {
        insights.typeDistribution[item.TYPE] = (insights.typeDistribution[item.TYPE] || 0) + 1;
        insights.depthDistribution[item.DEPTH] = (insights.depthDistribution[item.DEPTH] || 0) + 1;
        insights.pageDepthDistribution[item.PAGE_DEPTH] = (insights.pageDepthDistribution[item.PAGE_DEPTH] || 0) + 1;
    });

    // Format workspace insights from dataframe_3
    const workspaceInsights = insightsData && insightsData.length > 0 ? insightsData[0] : null;

    // Format key insights from dataframe_4
    const keyInsights = keyInsightsData || [];
    console.log('Key insights from dataframe_4:', keyInsights);

    // Create HTML output
    let html = `
        <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 class="text-2xl font-bold mb-4">Workspace Structure Insights</h2>
            
            ${workspaceInsights ? `
            <div class="mb-8 p-4 bg-indigo-50 rounded-lg">
                <h3 class="font-semibold text-lg text-indigo-900 mb-3">Workspace Overview</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${Object.entries(workspaceInsights).map(([key, value]) => `
                        <div class="bg-white p-3 rounded shadow-sm">
                            <div class="text-sm text-gray-500">${formatKey(key)}</div>
                            <div class="text-lg font-semibold text-gray-900">${formatValue(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${keyInsights.length > 0 ? `
            <div class="mb-8 p-4 bg-emerald-50 rounded-lg">
                <h3 class="font-semibold text-lg text-emerald-900 mb-3">Key Insights</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${Object.entries(keyInsights[0] || {}).map(([key, value]) => `
                        <div class="bg-white p-3 rounded shadow-sm">
                            <div class="text-sm text-gray-500">${formatKey(key)}</div>
                            <div class="text-lg font-semibold text-gray-900">${formatValue(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="p-4 bg-gray-50 rounded">
                    <h3 class="font-semibold">Structure Overview</h3>
                    <ul class="mt-2">
                        <li>Total Pages: ${insights.totalPages}</li>
                        <li>Root Pages: ${insights.rootPages}</li>
                        <li>Max Depth: ${insights.maxDepth}</li>
                        <li>Max Page Depth: ${insights.maxPageDepth}</li>
                    </ul>
                </div>
                
                <div class="p-4 bg-gray-50 rounded">
                    <h3 class="font-semibold">Page Types</h3>
                    <ul class="mt-2">
                        ${Object.entries(insights.typeDistribution)
                            .map(([type, count]) => `<li>${formatKey(type)}: ${count}</li>`)
                            .join('')}
                    </ul>
                </div>
                
                <div class="p-4 bg-gray-50 rounded">
                    <h3 class="font-semibold">Depth Distribution</h3>
                    <ul class="mt-2">
                        ${Object.entries(insights.depthDistribution)
                            .map(([depth, count]) => `<li>Depth ${depth}: ${count} pages</li>`)
                            .join('')}
                    </ul>
                </div>
            </div>

            <div class="mt-6">
                <h3 class="font-semibold mb-3">Workspace Visualization</h3>
                <div id="graph-container" class="w-full h-[800px] min-h-[800px] lg:h-[1000px] relative bg-gray-50 rounded-lg overflow-hidden">
                    <!-- Graph Controls -->
                    <div class="graph-controls absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2">
                        <button class="graph-control-button hover:bg-gray-100" id="zoomIn" title="Zoom In">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </button>
                        <button class="graph-control-button hover:bg-gray-100" id="zoomOut" title="Zoom Out">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <button class="graph-control-button hover:bg-gray-100" id="resetZoom" title="Reset View">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Tooltip Container -->
                    <div id="graph-tooltip" class="hidden absolute z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs text-sm"></div>

                    <!-- Timeline Container -->
                    <div class="timeline-container absolute bottom-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-medium text-gray-600" id="timelineStart"></span>
                            <span class="text-sm font-medium text-gray-600" id="timelineEnd"></span>
                        </div>
                        <div class="timeline-slider relative h-2 bg-gray-200 rounded-full cursor-pointer" id="timelineSlider">
                            <div class="timeline-progress absolute h-full bg-blue-500 rounded-full" id="timelineProgress"></div>
                            <div class="timeline-handle absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full -ml-2 cursor-grab active:cursor-grabbing" id="timelineHandle">
                                <div class="timeline-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap" id="timelineTooltip"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}

// Helper function to format keys for display
function formatKey(key) {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Helper function to format values for display
function formatValue(value) {
    if (typeof value === 'number') {
        // Format percentages
        if (value >= 0 && value <= 1) {
            return `${(value * 100).toFixed(1)}%`;
        }
        // Format large numbers
        return value.toLocaleString();
    }
    return value;
}

// Add resize handler for graph responsiveness
window.addEventListener('resize', debounce(() => {
    const container = document.getElementById('graph-container');
    if (container && container.querySelector('svg')) {
        const data = window._lastGraphData?.graphData; // Get just the graphData
        if (data && Array.isArray(data)) {
            initializeGraph(data);
        }
    }
}, 250));

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Transform data for force-directed graph
function transformDataForGraph(data) {
    try {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Invalid input data');
            return { nodes: [], links: [] };
        }

        // Create nodes array
        const nodes = data.map(item => ({
            id: item.ID,
            name: item.TEXT || item.TYPE,
            type: item.TYPE,
            createdTime: item.CREATED_TIME ? new Date(Number(item.CREATED_TIME)) : null,
            depth: Number(item.DEPTH) || 0,
            pageDepth: Number(item.PAGE_DEPTH) || 0,
            parentId: item.PARENT_ID,
            originalData: item
        }));

        // Create links array
        const links = [];
        nodes.forEach(node => {
            if (node.parentId) {
                const parent = nodes.find(n => n.id === node.parentId);
                if (parent) {
                    links.push({
                        source: parent.id,
                        target: node.id,
                        value: 1
                    });
                }
            }
        });

        return { nodes, links };
    } catch (error) {
        console.error('Error transforming data:', error);
        return { nodes: [], links: [] };
    }
}

// Initialize the force-directed graph
function initializeGraph(graphData) {
    try {
        // Extract dataframes from the response
        const df2 = graphData.data.dataframe_2;
        const df3 = graphData.data.dataframe_3;

        // Transform and create graph
        const { nodes, links } = transformDataForGraph(df2);
        if (!nodes.length) {
            console.error('No nodes to display');
            return;
        }

        // Get container and clear existing content
        const container = document.getElementById('graph-container');
        container.innerHTML = '';

        // Add insights section if df3 exists
        if (df3 && df3.length > 0) {
            const insights = df3[0]; // Get the first row of insights
            const insightsContainer = document.createElement('div');
            insightsContainer.className = 'absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10 max-w-sm';
            insightsContainer.innerHTML = `
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Workspace Insights</h3>
                <div class="space-y-2">
                    ${Object.entries(insights)
                        .map(([key, value]) => `
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-500">${formatKey(key)}:</span>
                                <span class="font-medium text-gray-900">${formatValue(value)}</span>
                            </div>
                        `).join('')}
                </div>
            `;
            container.appendChild(insightsContainer);
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height])
            .attr('class', 'graph-svg');

        // Create container group for zoom
        const g = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom);

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .alphaDecay(0.02)
            .velocityDecay(0.4);

        // Create arrow marker for links
        svg.append('defs').selectAll('marker')
            .data(['end'])
            .join('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('fill', '#999')
            .attr('d', 'M0,-5L10,0L0,5');

        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow)');

        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', d => `node ${d.type}`)
            .call(drag(simulation));

        // Add circles for nodes
        node.append('circle')
            .attr('r', d => Math.max(8, 12 - d.depth))
            .attr('fill', d => colorScale(d.type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        node.append('text')
            .attr('dy', -10)
            .attr('text-anchor', 'middle')
            .text(d => d.name.substring(0, 20))
            .attr('class', 'node-label')
            .clone(true).lower()
            .attr('stroke', 'white')
            .attr('stroke-width', 3);

        // Add tooltip
        const tooltip = d3.select(container)
            .append('div')
            .attr('id', 'graph-tooltip');

        // Node hover effects
        node.on('mouseover', (event, d) => {
            // Stop node movement during hover
            d.fx = d.x;
            d.fy = d.y;

            // Highlight connected nodes and links
            const connectedNodes = new Set();
            links.forEach(l => {
                if (l.source.id === d.id) connectedNodes.add(l.target.id);
                if (l.target.id === d.id) connectedNodes.add(l.source.id);
            });

            node.style('opacity', n => connectedNodes.has(n.id) || n.id === d.id ? 1 : 0.2);
            link.style('opacity', l => 
                l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
            );

            // Show tooltip with fixed positioning
            const containerRect = container.getBoundingClientRect();
            const nodeRect = event.target.getBoundingClientRect();
            const tooltipX = nodeRect.left - containerRect.left + nodeRect.width + 10;
            const tooltipY = nodeRect.top - containerRect.top;

            tooltip
                .style('display', 'block')
                .style('left', `${tooltipX}px`)
                .style('top', `${tooltipY}px`)
                .html(`
                    <div class="bg-white p-3 rounded-lg shadow-lg">
                        <div class="font-bold text-gray-900 flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" style="background: ${colorScale(d.type)}"></span>
                            ${d.name}
                        </div>
                        <div class="mt-2 space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Type:</span>
                                <span class="font-medium">${d.type}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Created:</span>
                                <span class="font-medium">${d.createdTime?.toLocaleDateString() || 'Unknown'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Depth:</span>
                                <span class="font-medium">${d.depth}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Connections:</span>
                                <span class="font-medium">${connectedNodes.size}</span>
                            </div>
                        </div>
                    </div>
                `);
        })
        .on('mouseout', (event, d) => {
            // Release node position when not hovering
            d.fx = null;
            d.fy = null;

            node.style('opacity', 1);
            link.style('opacity', 0.6);
            tooltip.style('display', 'none');
        });

        // Add timeline slider
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        const startDate = d3.min(nodes, d => d.createdTime);
        const endDate = d3.max(nodes, d => d.createdTime);
        
        timelineContainer.innerHTML = `
            <div class="flex justify-between mb-2">
                <span class="text-sm font-medium text-gray-600">${startDate?.toLocaleDateString() || 'N/A'}</span>
                <span class="text-sm font-medium text-gray-600">${endDate?.toLocaleDateString() || 'N/A'}</span>
            </div>
            <input type="range" 
                min="${startDate?.getTime() || 0}" 
                max="${endDate?.getTime() || 100}" 
                value="${endDate?.getTime() || 100}" 
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                id="timelineSlider">
        `;
        container.appendChild(timelineContainer);

        // Timeline slider functionality
        const slider = document.getElementById('timelineSlider');
        
        function updateNodesVisibility(currentTime) {
            // Update visibility based on creation time
            node.style('opacity', d => {
                const nodeTime = d.createdTime;
                return nodeTime && nodeTime <= currentTime ? 1 : 0.1;
            });
            
            link.style('opacity', d => {
                const sourceTime = d.source.createdTime;
                const targetTime = d.target.createdTime;
                return sourceTime && targetTime && 
                       sourceTime <= currentTime && 
                       targetTime <= currentTime ? 0.6 : 0.1;
            });
        }

        // Set initial state to show all nodes
        updateNodesVisibility(endDate);

        slider.addEventListener('input', (event) => {
            const currentTime = new Date(parseInt(event.target.value));
            updateNodesVisibility(currentTime);
        });

        // Reset visibility when clicking outside nodes
        svg.on('click', (event) => {
            if (event.target.tagName === 'svg') {
                updateNodesVisibility(new Date(slider.value));
            }
        });

        // Add zoom controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'graph-controls';
        controlsContainer.innerHTML = `
            <button class="graph-control-button" id="zoomIn" title="Zoom In">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
            </button>
            <button class="graph-control-button" id="zoomOut" title="Zoom Out">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
            </button>
            <button class="graph-control-button" id="resetZoom" title="Reset View">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </button>
        `;
        container.appendChild(controlsContainer);

        // Initialize zoom controls
        d3.select('#zoomIn').on('click', () => zoom.scaleBy(svg.transition().duration(300), 1.5));
        d3.select('#zoomOut').on('click', () => zoom.scaleBy(svg.transition().duration(300), 0.75));
        d3.select('#resetZoom').on('click', () => {
            const bounds = g.node().getBBox();
            const scale = 0.9 / Math.max(bounds.width / width, bounds.height / height);
            const translate = [
                (width - scale * bounds.width) / 2 - scale * bounds.x,
                (height - scale * bounds.height) / 2 - scale * bounds.y
            ];
            svg.transition()
                .duration(300)
                .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
        });

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Initial zoom to fit
        setTimeout(() => {
            d3.select('#resetZoom').dispatch('click');
        }, 100);

    } catch (error) {
        console.error('Error in initializeGraph:', error);
        showStatus('Error initializing graph visualization', false);
    }
}

// Drag behavior for nodes
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

// Color scale for different types
const colorScale = d3.scaleOrdinal()
    .domain(['page', 'collection_view_page', 'collection'])
    .range(['#4F46E5', '#10B981', '#EC4899']);

function showStatus(message, showSpinner = false) {
    statusSection.classList.remove('hidden');
    statusText.textContent = message;
    
    if (showSpinner) {
        statusSpinner.classList.remove('hidden');
    } else {
        statusSpinner.classList.add('hidden');
    }
} 