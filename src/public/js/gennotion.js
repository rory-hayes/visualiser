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
            rawData: data // Log the raw data to see its structure
        });

        resultsSection.classList.remove('hidden');
        
        // Extract the two dataframes with proper error handling
        let graphData, insightsData;
        
        if (data && typeof data === 'object') {
            // Try different possible data structures
            if (data.dataframe_2) {
                graphData = data.dataframe_2;
                insightsData = data.dataframe_3;
            } else if (data.data && data.data.dataframe_2) {
                graphData = data.data.dataframe_2;
                insightsData = data.data.dataframe_3;
            } else {
                // If we can't find the expected structure, log it and throw an error
                console.error('Unexpected data structure:', data);
                throw new Error('Could not find dataframe_2 in the response data');
            }
        } else {
            throw new Error('Invalid data received');
        }
        
        console.log('Extracted dataframes:', {
            graphDataLength: graphData?.length,
            insightsDataLength: insightsData?.length,
            graphDataSample: graphData?.[0],
            insightsDataSample: insightsData?.[0]
        });

        if (!Array.isArray(graphData)) {
            throw new Error('graphData is not an array');
        }

        resultsContent.innerHTML = formatResults(graphData, insightsData);
        
        // Wait for next frame to ensure container is rendered
        requestAnimationFrame(() => {
            try {
                // Scroll results into view
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Wait for scroll and any animations to complete
                setTimeout(() => {
                    try {
                        initializeGraph(graphData);
                        
                        // Force a resize event to ensure proper dimensions
                        window.dispatchEvent(new Event('resize'));
                    } catch (graphError) {
                        console.error('Error initializing graph:', graphError);
                        throw graphError;
                    }
                }, 500);
            } catch (scrollError) {
                console.error('Error in scroll/animation handling:', scrollError);
                throw scrollError;
            }
        });
    } catch (error) {
        console.error('Error in displayResults:', error);
        console.error('Data that caused error:', JSON.stringify(data, null, 2));
        showStatus('Error displaying results: ' + error.message, false);
        throw error;
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
                <div id="graph-container" class="w-full h-[600px] relative">
                    <div id="graph-tooltip" class="hidden absolute"></div>
                    <div class="graph-controls">
                        <button id="zoomIn" class="graph-control-button" title="Zoom In">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </button>
                        <button id="zoomOut" class="graph-control-button" title="Zoom Out">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <button id="resetZoom" class="graph-control-button" title="Reset View">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                        </button>
                    </div>
                    <div class="timeline-container">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-gray-500" id="timelineStart"></span>
                            <span class="text-sm text-gray-500" id="timelineEnd"></span>
                        </div>
                        <div class="timeline-slider" id="timelineSlider">
                            <div class="timeline-progress" id="timelineProgress"></div>
                            <div class="timeline-handle" id="timelineHandle">
                                <div class="timeline-tooltip" id="timelineTooltip"></div>
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
        const data = window._lastGraphData; // Store last used data
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

// Transform data for D3
function transformDataForGraph(data) {
    try {
        console.log('Transforming data for graph:', { dataLength: data.length });
        
        // Create nodes with more information
        const nodes = data.map(item => {
            try {
                // Convert Unix epoch milliseconds to Date object
                const createdTime = item.CREATED_TIME ? new Date(Number(item.CREATED_TIME)) : null;
                return {
                    id: item.ID,
                    type: item.TYPE,
                    depth: item.DEPTH,
                    pageDepth: item.PAGE_DEPTH,
                    ancestors: JSON.parse(item.ANCESTORS || '[]'),
                    parentId: item.PARENT_ID,
                    spaceId: item.SPACE_ID,
                    text: item.TEXT,
                    createdTime: createdTime,
                    // Store the original data for tooltip
                    originalData: item
                };
            } catch (e) {
                console.error('Error transforming node:', { item, error: e });
                return null;
            }
        }).filter(Boolean);

        // Sort nodes by creation time
        nodes.sort((a, b) => {
            if (!a.createdTime) return -1;
            if (!b.createdTime) return 1;
            return a.createdTime - b.createdTime;
        });

        console.log('Transformed nodes:', { nodeCount: nodes.length });

        // Create links from ancestors
        const links = [];
        nodes.forEach(node => {
            if (node.parentId) {
                // Only create link if both source and target exist
                const sourceExists = nodes.some(n => n.id === node.parentId);
                const targetExists = nodes.some(n => n.id === node.id);
                
                if (sourceExists && targetExists) {
                    links.push({
                        source: node.parentId,
                        target: node.id
                    });
                }
            }
        });

        console.log('Created links:', { linkCount: links.length });
        return { nodes, links };
    } catch (error) {
        console.error('Error in transformDataForGraph:', error);
        return { nodes: [], links: [] };
    }
}

// Color scale for different types
const colorScale = d3.scaleOrdinal()
    .domain(['page', 'collection_view_page', 'collection'])
    .range(['#60A5FA', '#34D399', '#F472B6']);

// Initialize the graph visualization
function initializeGraph(data) {
    try {
        // Store data for resize handling
        window._lastGraphData = data;
        
        console.log('Initializing graph with data:', { 
            dataLength: data.length,
            sampleNode: data[0] 
        });

        const { nodes, links } = transformDataForGraph(data);
        
        if (nodes.length === 0) {
            console.error('No valid nodes to display');
            return;
        }

        // Clear existing graph
        d3.select('#graph-container svg').remove();

        // Create SVG container
        const container = document.getElementById('graph-container');
        if (!container) {
            console.error('Graph container not found');
            return;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;
        console.log('Container dimensions:', { width, height });

        const svg = d3.select('#graph-container')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'graph-svg');

        // Create main group for zoom/pan with a background rect to catch events
        const g = svg.append('g')
            .attr('class', 'graph-group');
            
        // Add a background rectangle to catch events
        g.append('rect')
            .attr('class', 'graph-background')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        // Add zoom behavior with bounds
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom)
            .on('dblclick.zoom', null); // Disable double-click zoom

        // Create the force simulation with adjusted parameters
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);

        // Create nodes with adjusted sizes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('class', 'node')
            .attr('r', d => Math.max(8, 6 + d.depth * 1.5))
            .attr('fill', d => colorScale(d.type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .call(drag(simulation));

        // Add tooltips
        const tooltip = d3.select('#graph-tooltip');
        
        node.on('mouseover', (event, d) => {
            const parentNode = nodes.find(n => n.id === d.parentId);
            const childCount = links.filter(l => l.source.id === d.id).length;
            
            const rect = event.target.getBoundingClientRect();
            const tooltipX = rect.x + rect.width + 10;
            const tooltipY = rect.y;
            
            tooltip
                .style('display', 'block')
                .style('left', `${tooltipX}px`)
                .style('top', `${tooltipY}px`)
                .html(`
                    <div class="p-2">
                        <div class="font-bold text-gray-900 mb-1">${d.type}</div>
                        <div class="text-sm space-y-1">
                            <div class="flex items-center">
                                <span class="text-gray-500">ID:</span>
                                <span class="ml-2 font-mono text-xs">${d.id.slice(0, 8)}...</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">Depth:</span>
                                <span class="ml-2">${d.depth}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">Page Depth:</span>
                                <span class="ml-2">${d.pageDepth}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">Children:</span>
                                <span class="ml-2">${childCount}</span>
                            </div>
                            ${parentNode ? `
                            <div class="flex items-center">
                                <span class="text-gray-500">Parent Type:</span>
                                <span class="ml-2">${parentNode.type}</span>
                            </div>
                            ` : ''}
                            ${d.text ? `
                            <div class="mt-2 pt-2 border-t border-gray-200">
                                <div class="text-gray-500">Content:</div>
                                <div class="text-xs mt-1">${d.text}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `);

            // Adjust tooltip position if it goes off screen
            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (tooltipRect.right > viewportWidth) {
                tooltip.style('left', `${rect.x - tooltipRect.width - 10}px`);
            }
            if (tooltipRect.bottom > viewportHeight) {
                tooltip.style('top', `${rect.y + rect.height - tooltipRect.height}px`);
            }
        })
        .on('mouseout', () => {
            tooltip.style('display', 'none');
        })
        .on('click', (event, d) => {
            // Highlight connected nodes
            const connected = new Set([d.id, ...(d.ancestors || [])]);
            node.attr('opacity', n => connected.has(n.id) ? 1 : 0.1);
            link.attr('opacity', l => connected.has(l.source.id) && connected.has(l.target.id) ? 1 : 0.1);
        });

        // Add zoom controls
        d3.select('#zoomIn').on('click', () => {
            zoom.scaleBy(svg.transition().duration(750), 1.2);
        });

        d3.select('#zoomOut').on('click', () => {
            zoom.scaleBy(svg.transition().duration(750), 0.8);
        });

        d3.select('#resetZoom').on('click', () => {
            fitGraphToView();
        });

        // Double click background to reset opacities
        svg.on('dblclick', () => {
            node.attr('opacity', 1);
            link.attr('opacity', 1);
        });

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

        // Function to fit graph to view
        function fitGraphToView() {
            const bounds = g.node().getBBox();
            const fullWidth = width;
            const fullHeight = height;
            const width_ = bounds.width;
            const height_ = bounds.height;
            const midX = bounds.x + width_ / 2;
            const midY = bounds.y + height_ / 2;

            if (width_ === 0 || height_ === 0) return; // nothing to fit

            const scale = 0.8 / Math.max(width_ / fullWidth, height_ / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            svg.transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(translate[0], translate[1])
                        .scale(scale)
                );
        }

        // Initial fit after simulation has settled
        simulation.on('end', fitGraphToView);

        // Initialize timeline
        const timelineSlider = document.getElementById('timelineSlider');
        const timelineHandle = document.getElementById('timelineHandle');
        const timelineTooltip = document.getElementById('timelineTooltip');
        const timelineProgress = document.getElementById('timelineProgress');
        const timelineStart = document.getElementById('timelineStart');
        const timelineEnd = document.getElementById('timelineEnd');

        // Get time range
        const times = nodes.map(n => n.createdTime).filter(Boolean);
        if (times.length > 0) {
            const minTime = new Date(Math.min(...times));
            const maxTime = new Date(Math.max(...times));
            
            // Format dates with time
            const formatDate = (date) => {
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };
            
            timelineStart.textContent = formatDate(minTime);
            timelineEnd.textContent = formatDate(maxTime);

            function updateTimelinePosition(progress) {
                timelineHandle.style.left = `${progress}%`;
                timelineProgress.style.width = `${progress}%`;
                
                const currentTime = new Date(minTime.getTime() + (maxTime.getTime() - minTime.getTime()) * (progress / 100));
                timelineTooltip.textContent = formatDate(currentTime);

                // Update node visibility - show nodes created before or at current time
                node.attr('opacity', d => {
                    if (!d.createdTime) return 0.3; // Semi-transparent for nodes without creation time
                    return d.createdTime <= currentTime ? 1 : 0.1;
                });

                // Update link visibility - only show links where both nodes are visible
                link.attr('opacity', l => {
                    const sourceTime = l.source.createdTime;
                    const targetTime = l.target.createdTime;
                    if (!sourceTime || !targetTime) return 0.2;
                    return (sourceTime <= currentTime && targetTime <= currentTime) ? 0.6 : 0.05;
                });
            }

            // Add drag behavior to timeline with improved handling
            let isDragging = false;

            timelineSlider.addEventListener('mousedown', startDragging);
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDragging);

            function startDragging(e) {
                isDragging = true;
                handleDrag(e);
            }

            function handleDrag(e) {
                if (!isDragging) return;
                e.preventDefault(); // Prevent text selection while dragging
                
                const rect = timelineSlider.getBoundingClientRect();
                let progress = ((e.clientX - rect.left) / rect.width) * 100;
                progress = Math.max(0, Math.min(100, progress));
                
                updateTimelinePosition(progress);
            }

            function stopDragging() {
                isDragging = false;
            }

            // Initialize with all nodes visible
            updateTimelinePosition(100);
        } else {
            // Hide timeline if no time data
            const timelineContainer = document.querySelector('.timeline-container');
            if (timelineContainer) {
                timelineContainer.style.display = 'none';
            }
        }

        console.log('Graph initialization complete');
    } catch (error) {
        console.error('Error in initializeGraph:', error);
    }
}

// Drag behavior
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

function showStatus(message, showSpinner = false) {
    statusSection.classList.remove('hidden');
    statusText.textContent = message;
    
    if (showSpinner) {
        statusSpinner.classList.remove('hidden');
    } else {
        statusSpinner.classList.add('hidden');
    }
} 