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
        showStatus('Error generating report. Please try again.');
    }
}

async function processWorkspace(workspaceId) {
    try {
        if (!workspaceId) {
            throw new Error('Workspace ID is required');
        }

        showStatus('Checking server status...', true);
        
        const isServerHealthy = await checkServerStatus();
        if (!isServerHealthy) {
            showStatus('Server is not responding. Please try again later.');
            return;
        }

        // Trigger Hex report
        showStatus(`Triggering report for workspace ${workspaceId}...`, true);
        
        const requestBody = {
            workspaceId: workspaceId.trim(),
            projectId: HEX_PROJECT_ID
        };

        console.log('Sending request with body:', requestBody);
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            let errorMessage = data.error || 'Failed to trigger report';
            if (data.details) {
                errorMessage += `: ${data.details}`;
            }
            throw new Error(errorMessage);
        }

        if (!data.success || !data.runId) {
            throw new Error('Invalid response from server');
        }

        // Log successful response
        console.log('Report generation triggered:', {
            success: data.success,
            runId: data.runId
        });

        showStatus(`Report triggered for workspace ${workspaceId}. Waiting for results...`, true);
        
        // Start listening for results
        listenForResults();

    } catch (error) {
        console.error('Error processing workspace:', error);
        let errorMessage = error.message;
        
        // Add more context for specific errors
        if (errorMessage.includes('Hex API Error')) {
            errorMessage += '. Please check your Hex API configuration.';
        } else if (errorMessage.includes('Invalid Hex API key')) {
            errorMessage = 'API key is invalid or expired. Please update your configuration.';
        } else if (errorMessage.includes('Hex project not found')) {
            errorMessage = 'Hex project configuration is incorrect. Please verify the project ID.';
        }
        
        showStatus(`Error processing workspace ${workspaceId}: ${errorMessage}`, false);
    }
}

function listenForResults() {
    let retryCount = 0;
    const MAX_RETRIES = 5;
    let accumulatedData = {
        dataframe_2: [],
        dataframe_3: null
    };
    let lastProcessedChunk = 0;
    let totalExpectedRecords = 0;
    let connectionTimeout = null;
    
    function showProgress(current, total, chunk, totalChunks) {
        // First ensure status section is visible
        const statusSection = document.getElementById('statusSection');
        if (statusSection) {
            statusSection.classList.remove('hidden');
        }

        // Get or create progress container
        let progressElement = document.getElementById('progress-container');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'progress-container';
            progressElement.className = 'mt-4 bg-white rounded-lg shadow p-4';
            
            // Try to append to status section first
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.appendChild(progressElement);
            } else {
                // Fallback to status section if status element doesn't exist
                statusSection?.appendChild(progressElement);
            }
        }

        // Ensure we have valid numbers before formatting
        const currentCount = typeof current === 'number' ? current : 0;
        const totalCount = typeof total === 'number' ? total : 0;
        const currentChunk = typeof chunk === 'number' ? chunk : 0;
        const totalChunksCount = typeof totalChunks === 'number' ? totalChunks : 0;

        if (progressElement) {
            const percentage = totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0;
            const chunkPercentage = totalChunksCount > 0 ? Math.round((currentChunk / totalChunksCount) * 100) : 0;
            
            progressElement.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Records: ${currentCount.toLocaleString()} / ${totalCount.toLocaleString()}</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="bg-gray-200 rounded-full h-2.5 mb-2">
                            <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                                 style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Chunks: ${currentChunk} / ${totalChunksCount}</span>
                            <span>${chunkPercentage}%</span>
                        </div>
                        <div class="bg-gray-200 rounded-full h-2.5">
                            <div class="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                                 style="width: ${chunkPercentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function connectEventSource() {
        showStatus('Connecting to event stream...');
        
        const eventSource = new EventSource('/api/hex-results/stream');
        
        // Set connection timeout
        connectionTimeout = setTimeout(() => {
            if (eventSource.readyState !== EventSource.CLOSED) {
                console.log('Connection timeout - closing EventSource');
        eventSource.close();
                showStatus('Connection timeout. Please try again.', false);
            }
        }, 300000); // 5 minutes timeout
        
        eventSource.onopen = () => {
            console.log('EventSource connection opened');
            retryCount = 0;
            showStatus('Connection established', true);
        };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
                
            if (data.type === 'progress') {
                // Get total records from server or use dataframe size
                totalExpectedRecords = data.totalRecords || 121722; // Set to actual dataframe size
                showStatus(`Processing chunk ${data.currentChunk} of ${data.totalChunks}`, true);
                showProgress(data.recordsProcessed, totalExpectedRecords, data.currentChunk, data.totalChunks);
                return;
            }

            if (!data.data?.data?.dataframe_2) {
                console.warn('No dataframe_2 in received data');
                return;
            }

            const newRecords = data.data.data.dataframe_2;
            const currentChunk = data.currentChunk;
            const totalChunks = data.totalChunks || Math.ceil(totalExpectedRecords / 250); // 250 records per chunk

            // Only process new chunks
            if (currentChunk > lastProcessedChunk) {
                // Concatenate new records without any limit
                accumulatedData.dataframe_2 = accumulatedData.dataframe_2.concat(newRecords);
                
                // Store dataframe_3 if available and not already stored
                if (data.data.data.dataframe_3 && !accumulatedData.dataframe_3) {
                    accumulatedData.dataframe_3 = data.data.data.dataframe_3;
                }
                
                lastProcessedChunk = currentChunk;
                
                console.log('Received chunk:', {
                    currentChunk,
                    totalChunks,
                    newRecordsCount: newRecords.length,
                    accumulatedRecords: accumulatedData.dataframe_2.length,
                    totalExpectedRecords,
                    isLastChunk: data.isLastChunk
                });

                showProgress(
                    accumulatedData.dataframe_2.length, 
                    totalExpectedRecords,
                    currentChunk,
                    totalChunks
                );

                // Process results only when we have all the data
                if (data.isLastChunk || accumulatedData.dataframe_2.length >= totalExpectedRecords) {
                    console.log('Processing complete:', {
                        totalRecordsReceived: accumulatedData.dataframe_2.length,
                        expectedRecords: totalExpectedRecords,
                        chunks: `${currentChunk}/${totalChunks}`
                    });
                    
                    clearTimeout(connectionTimeout);
                    displayResults({
                        data: {
                            dataframe_2: accumulatedData.dataframe_2,
                            dataframe_3: accumulatedData.dataframe_3
                        },
                        metadata: {
                            status: 'success',
                            timestamp: new Date().toISOString()
                        },
                        success: true
                    });
                    eventSource.close();
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            showStatus(`Error processing data: ${error.message}`, false);
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
            console.log('EventSource readyState:', eventSource.readyState);
            
            if (eventSource.readyState === EventSource.CLOSED) {
                clearTimeout(connectionTimeout);
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    showStatus(`Connection lost. Retry attempt ${retryCount}/${MAX_RETRIES}...`, true);
                    setTimeout(() => {
        eventSource.close();
                        connectEventSource();
                    }, 2000 * retryCount);
                } else {
                    showStatus('Failed to maintain connection after multiple attempts. Please try again.', false);
                }
            }
        };

        return eventSource;
    }

    return connectEventSource();
}

// Add this helper function to check server status
async function checkServerStatus() {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error('Server health check failed');
        }
        return true;
    } catch (error) {
        console.error('Server health check error:', error);
        return false;
    }
}

function displayResults(response) {
    try {
        if (!response.success || !response.data) {
            throw new Error('Invalid response format');
        }

        // Show results section
        resultsSection.classList.remove('hidden');
        resultsContent.innerHTML = ''; // Clear previous results
        
        // Add metrics container
        const metricsContainer = document.createElement('div');
        metricsContainer.className = 'bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6';
        metricsContainer.innerHTML = formatResults(response.data.dataframe_2, response.data.dataframe_3);
        resultsContent.appendChild(metricsContainer);
        
        // Calculate metrics
        const metrics = calculateMetrics(response.data.dataframe_2, response.data.dataframe_3);
        updateMetricsDisplay(metrics);
        
        // Create or ensure graph container exists
        let container = document.createElement('div');
        container.id = 'graph-container';
        container.className = 'w-full h-[800px] min-h-[800px] lg:h-[1000px] relative bg-gray-50 rounded-lg overflow-hidden';
        resultsContent.appendChild(container);
        
        // Create graph visualization with the new data structure
        createGraphVisualization(response.data);
        
        showStatus('Analysis complete');
    } catch (error) {
        console.error('Error in displayResults:', error);
        showStatus('Error analyzing data');
    }
}

function createGraphVisualization(graphData) {
    try {
        // Validate and extract the data
        if (!graphData || !graphData.dataframe_2) {
            console.error('Invalid graph data structure:', graphData);
            return;
        }

        console.log('Creating visualization with data:', {
            hasDataframe2: !!graphData.dataframe_2,
            recordCount: graphData.dataframe_2.length,
            sampleRecord: graphData.dataframe_2[0]
        });

        const container = document.getElementById('graph-container');
        if (!container) {
            console.error('Graph container not found');
            return;
        }

        // Clear previous graph
        container.innerHTML = '';

        // Transform data for visualization
        const transformedData = transformDataForGraph(graphData.dataframe_2);

        if (transformedData.nodes.length === 0) {
            console.warn('No nodes to visualize');
            container.innerHTML = '<div class="p-4 text-gray-500">No data available for visualization</div>';
            return;
        }

        console.log('Visualization data prepared:', {
            nodes: transformedData.nodes.length,
            links: transformedData.links.length,
            nodeTypes: [...new Set(transformedData.nodes.map(n => n.type))]
        });

        // Initialize the graph with the transformed data
        initializeGraph(transformedData, container);

    } catch (error) {
        console.error('Error creating graph visualization:', error);
        const container = document.getElementById('graph-container');
        if (container) {
            container.innerHTML = '<div class="p-4 text-red-500">Error initializing graph visualization</div>';
        }
    }
}

// Update transformDataForGraph to handle the new data structure
function transformDataForGraph(data) {
    try {
        if (!Array.isArray(data)) {
            console.error('Invalid data format:', data);
            return { nodes: [], links: [] };
        }

        console.log('Starting graph data transformation:', {
            totalRecords: data.length,
            sampleRecord: data[0]
        });

        // Process nodes in chunks to avoid blocking the UI
        const CHUNK_SIZE = 500; // Reduced chunk size for smoother processing
        const nodes = [];
        const links = new Set();
        const nodeMap = new Map();
        const depthMap = new Map();
        let processedCount = 0;

        // Process nodes in chunks
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            processedCount += chunk.length;
            
            // First pass for chunk: Create nodes
            chunk.forEach(item => {
                if (!item.ID) return;

                const depth = parseInt(item.DEPTH) || 0;
                if (!depthMap.has(depth)) {
                    depthMap.set(depth, new Set());
                }
                depthMap.get(depth).add(item.ID);

                if (!nodeMap.has(item.ID)) {
                    let type = item.TYPE?.toLowerCase() || 'page';
                    type = type.replace(/_page$/, '')
                             .replace(/^page_/, '')
                             .replace(/^collection_view_/, 'view_');

                    const node = {
                        id: item.ID,
                        title: type,
                        type: type,
                        depth: depth,
                        parentId: item.PARENT_ID,
                        spaceId: item.SPACE_ID,
                        parentPageId: item.PARENT_PAGE_ID,
                        ancestors: [],
                        CREATED_TIME: item.CREATED_TIME
                    };

                    try {
                        if (item.ANCESTORS) {
                            const cleanedAncestors = item.ANCESTORS.replace(/\n/g, '').trim();
                            node.ancestors = JSON.parse(cleanedAncestors);
                        }
                    } catch (error) {
                        console.warn('Error parsing ancestors for node:', item.ID);
                        node.ancestors = [];
                    }

                    nodes.push(node);
                    nodeMap.set(item.ID, node);
                }
            });

            // Second pass for chunk: Create links
            chunk.forEach(item => {
                const node = nodeMap.get(item.ID);
                if (!node) return;

                // Direct parent-child relationship
                if (node.parentId && nodeMap.has(node.parentId)) {
                    links.add(JSON.stringify({
                        source: node.parentId,
                        target: node.id,
                        type: 'parent-child',
                        value: 3
                    }));
                }

                // Process ancestors
                if (Array.isArray(node.ancestors)) {
                    for (let i = 0; i < node.ancestors.length - 1; i++) {
                        const currentAncestor = node.ancestors[i];
                        const parentAncestor = node.ancestors[i + 1];
                        
                        if (nodeMap.has(currentAncestor) && nodeMap.has(parentAncestor)) {
                            links.add(JSON.stringify({
                                source: parentAncestor,
                                target: currentAncestor,
                                type: 'ancestor-chain',
                                value: 2
                            }));
                        }
                    }
                }

                // Connect to parent page if different from direct parent
                if (node.parentPageId && 
                    nodeMap.has(node.parentPageId) && 
                    node.parentPageId !== node.parentId) {
                    links.add(JSON.stringify({
                        source: node.parentPageId,
                        target: node.id,
                        type: 'page-hierarchy',
                        value: 1
                    }));
                }
            });

            // Log progress
            console.log(`Processed ${processedCount}/${data.length} records (${Math.round(processedCount/data.length*100)}%)`);
        }

        // Convert links to array and resolve references
        const processedLinks = Array.from(links).map(linkStr => {
            const link = JSON.parse(linkStr);
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            
            if (source && target) {
                return {
                    source,
                    target,
                    type: link.type,
                    value: link.value
                };
            }
            return null;
        }).filter(Boolean);

        // Log statistics
        const depthStats = {};
        depthMap.forEach((nodes, depth) => {
            depthStats[depth] = nodes.size;
        });

        console.log('Graph transformation complete:', {
            originalRecords: data.length,
            nodes: nodes.length,
            links: processedLinks.length,
            nodesByDepth: depthStats,
            nodeTypes: [...new Set(nodes.map(n => n.type))],
            linkTypes: [...new Set(processedLinks.map(l => l.type))],
            maxDepth: Math.max(...nodes.map(n => n.depth))
        });

        return { nodes, links: processedLinks };
    } catch (error) {
        console.error('Error transforming graph data:', error);
        return { nodes: [], links: [] };
    }
}

function formatResults(graphData, insightsData) {
    if (!Array.isArray(graphData) || graphData.length === 0) {
        return '<p class="text-gray-500">No results available</p>';
    }

    // Calculate metrics using reportGenerator
    const metrics = calculateMetrics(graphData, insightsData);

    // Create HTML output
    let html = `
        <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 class="text-2xl font-bold mb-4">Workspace Structure Insights</h2>
            
            <!-- Structure Metrics -->
            <div class="mb-8 p-4 bg-indigo-50 rounded-lg">
                <h3 class="font-semibold text-lg text-indigo-900 mb-3">Structure Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Total Pages</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.total_pages)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Active Pages</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.num_alive_pages)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Collections</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.collections_count)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Max Depth</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.max_depth)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Average Depth</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.avg_depth)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Deep Pages</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.deep_pages_count)}</div>
                    </div>
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
                </div>
            </div>
        </div>
    `;

    return html;
}

// Helper function to format values for display
function formatValue(value) {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    if (typeof value === 'number') {
        // Format percentages
        if (value >= -1 && value <= 1) {
            return `${(value * 100).toFixed(1)}%`;
        }
        // Format large numbers
        if (value >= 1000) {
            return value.toLocaleString();
        }
        // Format decimals
        if (value % 1 !== 0) {
            return value.toFixed(1);
        }
        return value.toString();
    }
    return value;
}

// Add resize handler for graph responsiveness
window.addEventListener('resize', debounce(() => {
    const container = document.getElementById('graph-container');
    if (container && window._lastGraphData?.graphData) {
        // Get the stored data
        const { graphData } = window._lastGraphData;
        
        // Only reinitialize if we have both container and data
        if (container && graphData) {
            try {
                // Clear existing graph
                container.innerHTML = '';
                
                // Reinitialize with current container and data
                initializeGraph(graphData, container);
                
                // Log resize event for debugging
                console.log('Graph reinitialized on resize:', {
                    containerWidth: container.clientWidth,
                    containerHeight: container.clientHeight,
                    nodesCount: graphData.length
                });
            } catch (error) {
                console.error('Error reinitializing graph on resize:', error);
            }
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

// Timeline slider functionality
function initializeTimeline(container, nodes, node, link, svg) {
    try {
        // Validate inputs
        if (!container || !nodes || !node || !link || !svg) {
            console.error('Missing required parameters for timeline initialization');
            return;
        }

        // Find valid date range from CREATED_TIME field
        const validDates = nodes
            .map(n => n.CREATED_TIME ? new Date(n.CREATED_TIME) : null)
            .filter(Boolean);
        
        if (validDates.length === 0) {
            console.warn('No valid dates found in nodes');
            return;
        }

        // Set start date to beginning of day and end date to end of day
        const startDate = new Date(Math.min(...validDates));
        startDate.setHours(0, 0, 0, 0);  // Start of day

        const endDate = new Date(Math.max(...validDates));
        endDate.setHours(23, 59, 59, 999);  // End of day

        // Log date range information
        console.log(`
            Timeline Initialization:
            Total nodes: ${nodes.length}
            Nodes with valid dates: ${validDates.length}
            Nodes without dates: ${nodes.length - validDates.length}
            Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
            Start timestamp: ${startDate.getTime()}
            End timestamp: ${endDate.getTime()}
        `);

        // Create timeline container if it doesn't exist
        let timelineContainer = container.querySelector('.timeline-container');
        if (!timelineContainer) {
            timelineContainer = document.createElement('div');
            timelineContainer.className = 'timeline-container absolute bottom-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4';
            container.appendChild(timelineContainer);
        }
        
        timelineContainer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-600">${startDate.toLocaleDateString()}</span>
                <span id="currentDate" class="text-sm font-medium text-indigo-600"></span>
                <span class="text-sm font-medium text-gray-600">${endDate.toLocaleDateString()}</span>
            </div>
            <div class="relative">
                <input type="range" 
                    min="${startDate.getTime()}" 
                    max="${endDate.getTime()}" 
                    value="${endDate.getTime()}" 
                    step="86400000"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    id="timelineSlider">
            </div>
        `;

        // Timeline slider functionality
        const slider = timelineContainer.querySelector('#timelineSlider');
        if (!slider) {
            console.error('Failed to find timeline slider element');
            return;
        }
        
        // Set initial state to show all nodes
        const initialTime = new Date(endDate);
        updateNodesVisibility(initialTime, node, link, nodes);

        // Update visibility on slider change
        slider.addEventListener('input', (event) => {
            const currentTime = new Date(parseInt(event.target.value));
            currentTime.setHours(23, 59, 59, 999);
            updateNodesVisibility(currentTime, node, link, nodes);
        });

        // Reset visibility when clicking outside nodes
        svg.on('click', (event) => {
            if (event.target.tagName === 'svg') {
                const currentTime = new Date(parseInt(slider.value));
                currentTime.setHours(23, 59, 59, 999);
                updateNodesVisibility(currentTime, node, link, nodes);
            }
        });

        // Make sure the timeline container is visible
        timelineContainer.style.display = 'block';
        timelineContainer.style.opacity = '1';

    } catch (error) {
        console.error('Error in initializeTimeline:', error);
        console.error('Error details:', {
            error: error.message,
            stack: error.stack
        });
    }
}

// Update the updateNodesVisibility function to work with CREATED_TIME
function updateNodesVisibility(currentTime, node, link, nodes) {
    try {
        const currentDateDisplay = document.getElementById('currentDate');
        if (currentDateDisplay) {
            currentDateDisplay.textContent = currentTime.toLocaleDateString();
        }

        // Count visible nodes for debugging
        let visibleCount = 0;
        let noDateCount = 0;

        // Update visibility based on CREATED_TIME
        node.style('opacity', d => {
            if (!d.CREATED_TIME) {
                noDateCount++;
                return 1; // Show nodes without dates
            }

            const nodeDate = new Date(d.CREATED_TIME);
            const isVisible = nodeDate.getTime() <= currentTime.getTime();
            if (isVisible) {
                visibleCount++;
                return 1;
            }
            return 0.1;
        });
        
        // Update links visibility
        link.style('opacity', d => {
            const sourceDate = d.source.CREATED_TIME ? new Date(d.source.CREATED_TIME) : null;
            const targetDate = d.target.CREATED_TIME ? new Date(d.target.CREATED_TIME) : null;
            
            const sourceVisible = !sourceDate || sourceDate.getTime() <= currentTime.getTime();
            const targetVisible = !targetDate || targetDate.getTime() <= currentTime.getTime();
            
            return sourceVisible && targetVisible ? 0.6 : 0.1;
        });

        console.log(`
            Visibility Update:
            Current Time: ${currentTime.toLocaleDateString()}
            Visible nodes: ${visibleCount}
            Nodes without dates: ${noDateCount}
            Total nodes: ${nodes.length}
        `);

    } catch (error) {
        console.error('Error in updateNodesVisibility:', error);
        console.error('Current Time:', currentTime);
    }
}

// Color scale for different node types
const colorScale = d3.scaleOrdinal()
    .domain(['page', 'collection_view_page', 'collection', 'database', 'table'])
    .range(['#4F46E5', '#10B981', '#EC4899', '#F59E0B', '#6366F1'])
    .unknown('#94A3B8'); // Default color for unknown types

// Drag behavior for nodes
function drag(simulation) {
    return d3.drag()
        .on('start', (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        })
        .on('end', (event) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        });
}

// Initialize the force-directed graph
function initializeGraph(data, container) {
    try {
        // Validate container
        if (!container) {
            console.error('Graph container is null or undefined');
            return;
        }

        // Validate graph data
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
            console.error('Invalid graph data:', data);
            return;
        }

        const { nodes, links } = data;

        console.log('Initializing graph with:', {
            nodes: nodes.length,
            links: links.length,
            hasCreatedTime: nodes.some(n => n.CREATED_TIME)
        });

        // Clear any existing graph
        container.innerHTML = '';

        // Initialize the visualization with larger dimensions for more space
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;
        const baseRadius = Math.min(width, height) / 50; // Dynamic node size based on container

        // Create SVG with zoom support
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior with adjusted scale range
        const g = svg.append('g');
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Create the force simulation with gentler forces
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(d => 100 + (d.value || 1) * 20))
            .force('charge', d3.forceManyBody()
                .strength(d => -300 - nodes.length * 0.5)
                .distanceMax(width / 2))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(baseRadius * 2))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .alphaDecay(0.02)
            .velocityDecay(0.3);

        // Add links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value || 1));

        // Add nodes with adjusted size
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', baseRadius)
            .attr('fill', d => colorScale(d.type))
            .call(drag(simulation));

        // Add labels with adjusted positioning
        const labels = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .attr('dx', baseRadius + 4)
            .attr('dy', 4)
            .text(d => d.title)
            .style('font-size', '10px')
            .style('fill', '#666');

        // Initialize timeline if we have dates
        if (nodes.some(n => n.CREATED_TIME)) {
            console.log('Initializing timeline with nodes containing CREATED_TIME');
            initializeTimeline(container, nodes, node, link, svg);
        } else {
            console.warn('No nodes with CREATED_TIME found');
        }

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

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
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

        // Add hover effects
        node.on('mouseover', (event, d) => {
            d.fx = d.x;
            d.fy = d.y;
            
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
                
            tooltip.html(`
                <div class="p-2">
                    <strong class="block text-lg mb-1">${d.title}</strong>
                    <span class="block text-sm text-gray-500">Type: ${d.type}</span>
                    ${d.CREATED_TIME ? `<span class="block text-sm text-gray-500">Created: ${new Date(d.CREATED_TIME).toLocaleDateString()}</span>` : ''}
                </div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');

            // Highlight connected nodes
            const connectedNodes = new Set();
            links.forEach(l => {
                if (l.source.id === d.id) connectedNodes.add(l.target.id);
                if (l.target.id === d.id) connectedNodes.add(l.source.id);
            });

            node.style('opacity', n => connectedNodes.has(n.id) || n.id === d.id ? 1 : 0.1);
            link.style('opacity', l => 
                l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
            );
        })
        .on('mouseout', (event, d) => {
            d.fx = null;
            d.fy = null;
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);

            node.style('opacity', 1);
            link.style('opacity', 0.6);
        });

        // Store data for resize handling
        container._graphData = {
            nodes,
            links,
            width,
            height
        };

        // Calculate initial zoom to fit with more padding
        const bounds = g.node().getBBox();
        const scale = 0.4 / Math.max(bounds.width / width, bounds.height / height);
        const translate = [
            (width - scale * bounds.width) / 2 - scale * bounds.x,
            (height - scale * bounds.height) / 2 - scale * bounds.y
        ];

        // Apply initial transform with a transition
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));

        // Start simulation with lower alpha
        simulation.alpha(0.5).restart();

    } catch (error) {
        console.error('Error in initializeGraph:', error);
        if (container) {
            container.innerHTML = '<div class="p-4 text-red-500">Error initializing graph visualization</div>';
        }
    }
}

function showStatus(message, showSpinner = false) {
    const statusSection = document.getElementById('statusSection');
    const statusText = document.getElementById('statusText');
    const statusSpinner = document.getElementById('statusSpinner');
    
    if (statusSection && statusText) {
    statusSection.classList.remove('hidden');
    statusText.textContent = message;
    
        if (statusSpinner) {
    if (showSpinner) {
        statusSpinner.classList.remove('hidden');
    } else {
        statusSpinner.classList.add('hidden');
            }
        }
    } else {
        console.warn('Status elements not found in DOM');
    }
}

function updateProgress(currentChunk, totalChunks, recordsProcessed, totalRecords) {
    const progressContainer = document.getElementById('progressContainer');
    if (!progressContainer) return;

    const percentage = (currentChunk / totalChunks) * 100;
    
    progressContainer.innerHTML = `
        <div class="mb-2">
            <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processing chunks: ${currentChunk}/${totalChunks}</span>
                <span>${Math.round(percentage)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                     style="width: ${percentage}%"></div>
            </div>
        </div>
        <div class="text-sm text-gray-600">
            <div>Records processed: ${recordsProcessed.toLocaleString()}</div>
            <div>Total records: ${totalRecords.toLocaleString()}</div>
            <div>Remaining: ${(totalRecords - recordsProcessed).toLocaleString()}</div>
        </div>
    `;
}

function updateMetricsDisplay(metrics) {
    try {
        // Update structure metrics
        updateMetricValue('total-pages', metrics.total_pages);
        updateMetricValue('active-pages', metrics.num_alive_pages);
        updateMetricValue('collections', metrics.collections_count);
        updateMetricValue('max-depth', metrics.max_depth);
        updateMetricValue('avg-depth', metrics.avg_depth);
        updateMetricValue('deep-pages', metrics.deep_pages_count);

        // Update usage metrics
        updateMetricValue('daily-active-users', metrics.daily_active_users);
        updateMetricValue('weekly-active-users', metrics.weekly_active_users);
        updateMetricValue('monthly-active-users', metrics.monthly_active_users);
        updateMetricValue('pages-per-user', metrics.pages_per_user);
        updateMetricValue('engagement-score', metrics.engagement_score);
        updateMetricValue('collaboration-rate', metrics.collaboration_rate);

        // Update growth metrics
        updateMetricValue('growth-rate', metrics.growth_rate);
        updateMetricValue('member-growth-rate', metrics.monthly_member_growth_rate);
        updateMetricValue('content-growth-rate', metrics.monthly_content_growth_rate);
        updateMetricValue('pages-created-month', metrics.pages_created_last_month);
        updateMetricValue('expected-members-year', metrics.expected_members_in_next_year);
        updateMetricValue('blocks-created-year', metrics.blocks_created_last_year);

        // Update performance metrics
        updateMetricValue('organization-score', metrics.current_organization_score);
        updateMetricValue('productivity-score', metrics.current_productivity_score);
        updateMetricValue('collaboration-score', metrics.current_collaboration_score);
        updateMetricValue('ai-productivity-gain', metrics.ai_productivity_gain);
        updateMetricValue('automation-potential', metrics.automation_potential);
        updateMetricValue('time-savings', metrics.projected_time_savings);

        // Update ROI metrics
        updateMetricValue('current-plan-cost', metrics.current_plan);
        updateMetricValue('enterprise-roi', metrics.enterprise_plan_roi);
        updateMetricValue('enterprise-ai-roi', metrics.enterprise_plan_w_ai_roi);
        updateMetricValue('growth-10-savings', metrics['10_percent_increase']);
        updateMetricValue('growth-20-savings', metrics['20_percent_increase']);
        updateMetricValue('growth-50-savings', metrics['50_percent_increase']);

        console.log('Metrics display updated successfully');
    } catch (error) {
        console.error('Error updating metrics display:', error);
    }
}

function updateMetricValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Format the value based on type
        let formattedValue = formatValue(value);
        element.textContent = formattedValue;
        
        // Add color coding based on value type
        if (typeof value === 'number') {
            if (value > 0) {
                element.classList.add('text-green-600');
                element.classList.remove('text-red-600', 'text-gray-600');
            } else if (value < 0) {
                element.classList.add('text-red-600');
                element.classList.remove('text-green-600', 'text-gray-600');
            } else {
                element.classList.add('text-gray-600');
                element.classList.remove('text-green-600', 'text-red-600');
            }
        }
    }
}

function calculateMetrics(graphData, insightsData) {
    try {
        if (!Array.isArray(graphData)) {
            console.warn('Invalid graph data format');
            return {};
        }

        // Initialize metrics object
        const metrics = {
            // Structure metrics
            total_pages: 0,
            num_alive_pages: 0,
            collections_count: 0,
            max_depth: 0,
            avg_depth: 0,
            deep_pages_count: 0,

            // Usage metrics (placeholder values until we have actual usage data)
            daily_active_users: 0,
            weekly_active_users: 0,
            monthly_active_users: 0,
            pages_per_user: 0,
            engagement_score: 0,
            collaboration_rate: 0,

            // Growth metrics
            growth_rate: 0,
            monthly_member_growth_rate: 0,
            monthly_content_growth_rate: 0,
            pages_created_last_month: 0,
            expected_members_in_next_year: 0,
            blocks_created_last_year: 0,

            // Performance metrics
            current_organization_score: 0,
            current_productivity_score: 0,
            current_collaboration_score: 0,
            ai_productivity_gain: 0,
            automation_potential: 0,
            projected_time_savings: 0,

            // ROI metrics
            current_plan: 0,
            enterprise_plan_roi: 0,
            enterprise_plan_w_ai_roi: 0,
            '10_percent_increase': 0,
            '20_percent_increase': 0,
            '50_percent_increase': 0
        };

        // Calculate structure metrics
        graphData.forEach(node => {
            // Count total pages
            if (node.TYPE.includes('page')) {
                metrics.total_pages++;
                
                // Count active pages (created in the last 90 days)
                const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
                if (node.CREATED_TIME && node.CREATED_TIME > ninetyDaysAgo) {
                    metrics.num_alive_pages++;
                }
            }

            // Count collections
            if (node.TYPE.includes('collection')) {
                metrics.collections_count++;
            }

            // Track depth metrics
            const depth = node.DEPTH || 0;
            metrics.max_depth = Math.max(metrics.max_depth, depth);
            
            if (depth > 3) {
                metrics.deep_pages_count++;
            }
        });

        // Calculate average depth
        const totalDepth = graphData.reduce((sum, node) => sum + (node.DEPTH || 0), 0);
        metrics.avg_depth = totalDepth / graphData.length;

        // Process insights data if available
        if (insightsData) {
            Object.assign(metrics, {
                daily_active_users: insightsData.daily_active_users || 0,
                weekly_active_users: insightsData.weekly_active_users || 0,
                monthly_active_users: insightsData.monthly_active_users || 0,
                pages_per_user: insightsData.pages_per_user || 0,
                engagement_score: insightsData.engagement_score || 0,
                collaboration_rate: insightsData.collaboration_rate || 0
            });
        }

        // Round numerical values to 2 decimal places
        Object.keys(metrics).forEach(key => {
            if (typeof metrics[key] === 'number') {
                metrics[key] = Math.round(metrics[key] * 100) / 100;
            }
        });

        console.log('Calculated metrics:', metrics);
        return metrics;

    } catch (error) {
        console.error('Error calculating metrics:', error);
        return {};
    }
} 