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

        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Extract the dataframes with proper error handling
        let graphData, insightsData;
        
        if (data && typeof data === 'object') {
            // Try different possible data structures
            if (data.data) {
                graphData = data.data.dataframe_2;
                insightsData = data.data.dataframe_3;
            } else {
                graphData = data.dataframe_2;
                insightsData = data.dataframe_3;
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
            insightsData
        };

        // Format and display results HTML
        resultsContent.innerHTML = formatResults(graphData, insightsData);
        
        // Get graph container after HTML is updated
        const container = document.getElementById('graph-container');
        if (!container) {
            console.error('Graph container not found');
            showStatus('Error: Graph container not found', false);
            return;
        }

        // Reset graph initialization flag
        window._graphInitialized = false;

        // Wait for next frame to ensure container is rendered
        requestAnimationFrame(() => {
            try {
                // Scroll results into view
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Initialize graph with delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        initializeGraph(graphData, container);
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

function formatResults(graphData, insightsData) {
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
        const data = window._lastGraphData?.graphData;
        if (data) {
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

        // Create nodes array with date validation
        const nodes = data.map(item => {
            let createdTime = null;
            if (item.CREATED_TIME) {
                // Handle both string and number timestamps
                const timestamp = typeof item.CREATED_TIME === 'string' ? 
                    parseInt(item.CREATED_TIME) : Number(item.CREATED_TIME);
                
                if (!isNaN(timestamp)) {
                    createdTime = new Date(timestamp);
                    // Validate date
                    if (createdTime.getFullYear() < 2000 || createdTime.getFullYear() > 2100) {
                        console.warn(`Invalid date for node ${item.ID}: ${createdTime}, timestamp: ${timestamp}`);
                        createdTime = null;
                    }
                }
            }

            return {
                id: item.ID,
                name: item.TEXT || item.TYPE,
                type: item.TYPE,
                createdTime,
                depth: Number(item.DEPTH) || 0,
                pageDepth: Number(item.PAGE_DEPTH) || 0,
                parentId: item.PARENT_ID,
                originalData: item
            };
        });

        // Log date range information
        const dates = nodes.map(n => n.createdTime).filter(Boolean);
        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));
        
        console.log('Date range in data:', {
            start: startDate.toLocaleDateString(),
            end: endDate.toLocaleDateString(),
            totalNodes: nodes.length,
            nodesWithDates: dates.length,
            nodesWithoutDates: nodes.length - dates.length
        });

        // Log nodes without dates for debugging
        const nodesWithoutDates = nodes.filter(n => !n.createdTime);
        if (nodesWithoutDates.length > 0) {
            console.warn('Nodes without valid dates:', nodesWithoutDates);
        }

        return { nodes, links: createLinks(nodes) };
    } catch (error) {
        console.error('Error transforming data:', error);
        return { nodes: [], links: [] };
    }
}

// Helper function to create links
function createLinks(nodes) {
    const links = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    nodes.forEach(node => {
        if (node.parentId && nodeMap.has(node.parentId)) {
            links.push({
                source: nodeMap.get(node.parentId),
                target: node,
                value: 1
            });
        }
    });

    return links;
}

// Timeline slider functionality
function updateNodesVisibility(currentTime, node, link, nodes) {
    const currentDateDisplay = document.getElementById('currentDate');
    currentDateDisplay.textContent = currentTime.toLocaleDateString();

    // Count visible nodes for debugging
    let visibleCount = 0;
    let noDateCount = 0;

    // Update visibility based on creation time
    node.style('opacity', d => {
        if (!d.createdTime) {
            noDateCount++;
            return 1; // Show nodes without dates
        }
        const isVisible = d.createdTime <= currentTime;
        if (isVisible) visibleCount++;
        return isVisible ? 1 : 0.1;
    });
    
    // Update links visibility only between visible nodes
    link.style('opacity', d => {
        const sourceVisible = !d.source.createdTime || d.source.createdTime <= currentTime;
        const targetVisible = !d.target.createdTime || d.target.createdTime <= currentTime;
        return sourceVisible && targetVisible ? 0.6 : 0.1;
    });

    console.log(`
        Date Range Info:
        Current Time: ${currentTime.toLocaleDateString()}
        Visible nodes: ${visibleCount}
        Nodes without dates: ${noDateCount}
        Total nodes: ${nodes.length}
    `);
}

// Initialize the force-directed graph
function initializeGraph(graphData, container) {
    try {
        // Validate container
        if (!container) {
            console.error('Graph container is null or undefined');
            return;
        }

        // Validate graph data
        if (!graphData || (!Array.isArray(graphData) && !graphData.data?.dataframe_2)) {
            console.error('Invalid graph data:', graphData);
            return;
        }

        // Clear any existing graph
        container.innerHTML = '';

        // Extract data from the response
        const df2 = graphData.data?.dataframe_2 || graphData;
        const df3 = graphData.data?.dataframe_3;

        // Validate df2
        if (!Array.isArray(df2) || df2.length === 0) {
            console.error('Invalid or empty dataframe_2:', df2);
            container.innerHTML = '<div class="p-4 text-gray-500">No data available for visualization</div>';
            return;
        }

        // Create nodes array with proper date handling
        const nodes = df2.map(item => {
            let createdTime = null;
            
            // Handle both string and number timestamps
            if (item.CREATED_TIME) {
                const timestamp = typeof item.CREATED_TIME === 'string' ? 
                    Date.parse(item.CREATED_TIME) : 
                    item.CREATED_TIME;
                    
                if (!isNaN(timestamp)) {
                    const date = new Date(timestamp);
                    const year = date.getFullYear();
                    
                    // Validate year is reasonable
                    if (year >= 2000 && year <= 2100) {
                        createdTime = date;
                    } else {
                        console.warn(`Invalid year ${year} for node ${item.id}`);
                    }
                }
            }
            
            return {
                id: item.ID || item.id,
                title: item.TEXT || item.title || item.TYPE || 'Untitled',
                url: item.URL || item.url,
                createdTime: createdTime,
                parent: item.PARENT_ID || item.parent
            };
        });

        // Create links array
        const links = [];
        nodes.forEach(node => {
            if (node.parent) {
                const parentNode = nodes.find(n => n.id === node.parent);
                if (parentNode) {
                    links.push({
                        source: parentNode,
                        target: node
                    });
                }
            }
        });

        // Initialize the visualization
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create the force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40))
            .force('x', d3.forceX().strength(0.05))
            .force('y', d3.forceY().strength(0.05))
            .alphaDecay(0.05)
            .velocityDecay(0.3);

        // Add links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Add nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 10)
            .attr('fill', '#69b3a2')
            .call(drag(simulation));

        // Initialize timeline
        initializeTimeline(container, nodes, node, link, svg);

        // Update positions on each tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

        // Add tooltips
        const tooltip = d3.select(container)
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background-color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            .style('max-width', '300px')
            .style('z-index', '1000');

        node.on('mouseover', (event, d) => {
            d.fx = d.x;
            d.fy = d.y;
            
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
                
            tooltip.html(`
                <strong>${d.title}</strong><br/>
                ${d.url ? `<a href="${d.url}" target="_blank">Open in Notion</a>` : ''}
                ${d.createdTime ? `<br/>Created: ${d.createdTime.toLocaleDateString()}` : ''}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', (event, d) => {
            d.fx = null;
            d.fy = null;
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

        // Store data for resize handling
        container._graphData = {
            nodes,
            links,
            width,
            height
        };

    } catch (error) {
        console.error('Error in initializeGraph:', error);
        if (container) {
            container.innerHTML = '<div class="p-4 text-red-500">Error initializing graph visualization</div>';
        }
    }
}

function initializeTimeline(container, nodes, node, link, svg) {
    try {
        // Validate inputs
        if (!container || !nodes || !node || !link || !svg) {
            console.error('Missing required parameters for timeline initialization');
            return;
        }

        // Find valid date range
        const validDates = nodes.map(n => n.createdTime).filter(Boolean);
        
        if (validDates.length === 0) {
            console.warn('No valid dates found in nodes');
            return;
        }

        const startDate = new Date(Math.min(...validDates));
        const endDate = new Date(Math.max(...validDates));

        // Log date range information
        console.log(`
            Date Range Info:
            Total nodes: ${nodes.length}
            Nodes with valid dates: ${validDates.length}
            Nodes without dates: ${nodes.length - validDates.length}
            Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
        `);

        // Add timeline slider
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container absolute bottom-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4';
        
        timelineContainer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-600">${startDate?.toLocaleDateString() || 'N/A'}</span>
                <span id="currentDate" class="text-sm font-medium text-indigo-600"></span>
                <span class="text-sm font-medium text-gray-600">${endDate?.toLocaleDateString() || 'N/A'}</span>
            </div>
            <input type="range" 
                min="${startDate?.getTime() || 0}" 
                max="${endDate?.getTime() || 100}" 
                value="${endDate?.getTime() || 100}" 
                step="86400000"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                id="timelineSlider">
        `;
        container.appendChild(timelineContainer);

        // Timeline slider functionality
        const slider = document.getElementById('timelineSlider');
        if (!slider) {
            console.error('Failed to find timeline slider element');
            return;
        }
        
        // Set initial state to show all nodes
        updateNodesVisibility(endDate, node, link, nodes);

        slider.addEventListener('input', (event) => {
            const currentTime = new Date(parseInt(event.target.value));
            updateNodesVisibility(currentTime, node, link, nodes);
        });

        // Reset visibility when clicking outside nodes
        svg.on('click', (event) => {
            if (event.target.tagName === 'svg') {
                const currentTime = new Date(parseInt(slider.value));
                updateNodesVisibility(currentTime, node, link, nodes);
            }
        });
    } catch (error) {
        console.error('Error in initializeTimeline:', error);
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