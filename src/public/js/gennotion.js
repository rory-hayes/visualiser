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

        resultsContent.innerHTML = formatResults(graphData, insightsData, keyInsightsData);
        
        // Wait for next frame to ensure container is rendered
        requestAnimationFrame(() => {
            try {
                // Scroll results into view
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Initialize graph with delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        if (!window._graphInitialized) {
                            initializeGraph(graphData);
                            window._graphInitialized = true;
                        }
                        
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
                    ${keyInsights.map(insight => `
                        <div class="bg-white p-3 rounded shadow-sm">
                            ${Object.entries(insight).map(([key, value]) => `
                                <div class="mb-1">
                                    <div class="text-sm text-gray-500">${formatKey(key)}</div>
                                    <div class="text-lg font-semibold text-gray-900">${formatValue(value)}</div>
                                </div>
                            `).join('')}
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
                <div id="graph-container" class="w-full h-[600px] relative bg-gray-50 rounded-lg">
                    <!-- Graph Controls -->
                    <div class="graph-controls">
                        <button class="graph-control-button" id="zoomIn" title="Zoom In">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </button>
                        <button class="graph-control-button" id="zoomOut" title="Zoom Out">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <button class="graph-control-button" id="resetZoom" title="Reset View">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Tooltip Container -->
                    <div id="graph-tooltip" class="hidden"></div>

                    <!-- Timeline Container -->
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
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Invalid input data for graph transformation:', data);
            return { nodes: [], links: [] };
        }

        console.log('Transforming data for graph:', { 
            dataLength: data.length,
            sampleData: data[0]
        });
        
        // Create nodes with more information and proper date parsing
        const nodes = data.map(item => {
            try {
                if (!item || typeof item !== 'object') {
                    console.warn('Invalid item in data:', item);
                    return null;
                }

                // Convert Unix epoch milliseconds to Date object with validation
                let createdTime = null;
                if (item.CREATED_TIME) {
                    const timestamp = Number(item.CREATED_TIME);
                    if (!isNaN(timestamp) && timestamp > 0) {
                        createdTime = new Date(timestamp);
                        // Validate the date is reasonable
                        if (createdTime.getFullYear() < 2000 || createdTime.getFullYear() > 2100) {
                            console.warn('Invalid date detected:', createdTime);
                            createdTime = null;
                        }
                    }
                }

                return {
                    id: item.ID,
                    type: item.TYPE || 'unknown',
                    depth: Number(item.DEPTH) || 0,
                    pageDepth: Number(item.PAGE_DEPTH) || 0,
                    ancestors: item.ANCESTORS ? JSON.parse(item.ANCESTORS) : [],
                    parentId: item.PARENT_ID,
                    spaceId: item.SPACE_ID,
                    text: item.TEXT || '',
                    createdTime: createdTime,
                    week: createdTime ? getWeekNumber(createdTime) : null,
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

        // Create links with validation
        const links = [];
        nodes.forEach(node => {
            if (node.parentId) {
                const parentNode = nodes.find(n => n.id === node.parentId);
                if (parentNode) {
                    links.push({
                        source: parentNode.id,
                        target: node.id,
                        value: 1,
                        sourceWeek: parentNode.week,
                        targetWeek: node.week
                    });
                }
            }
        });

        console.log('Transformed data:', {
            nodeCount: nodes.length,
            linkCount: links.length,
            weekRange: getWeekRange(nodes),
            sampleNode: nodes[0],
            sampleLink: links[0]
        });

        return { nodes, links };
    } catch (error) {
        console.error('Error in transformDataForGraph:', error);
        return { nodes: [], links: [] };
    }
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper function to get week range
function getWeekRange(nodes) {
    const weeks = nodes
        .filter(n => n.week)
        .map(n => ({
            week: n.week,
            year: n.createdTime.getFullYear()
        }));
    
    if (weeks.length === 0) return null;

    return {
        start: weeks.reduce((min, curr) => 
            curr.year < min.year || (curr.year === min.year && curr.week < min.week) ? curr : min
        ),
        end: weeks.reduce((max, curr) => 
            curr.year > max.year || (curr.year === max.year && curr.week > max.week) ? curr : max
        )
    };
}

function updateTimelinePosition(progress, nodes, links, weekRange) {
    if (!weekRange) return;

    const totalWeeks = (weekRange.end.year - weekRange.start.year) * 52 + 
                      (weekRange.end.week - weekRange.start.week);
    const currentWeek = Math.floor((totalWeeks * progress) / 100);
    
    const currentYear = weekRange.start.year + Math.floor(currentWeek / 52);
    const weekInYear = weekRange.start.week + (currentWeek % 52);

    // Update timeline UI
    const timelineHandle = document.getElementById('timelineHandle');
    const timelineProgress = document.getElementById('timelineProgress');
    const timelineTooltip = document.getElementById('timelineTooltip');

    if (timelineHandle && timelineProgress && timelineTooltip) {
        timelineHandle.style.left = `${progress}%`;
        timelineProgress.style.width = `${progress}%`;

        // Update tooltip with week information
        const tooltipDate = new Date(currentYear, 0, 1 + (weekInYear - 1) * 7);
        timelineTooltip.textContent = tooltipDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Get the node and link elements from the current graph state
    const node = d3.selectAll('.node');
    const link = d3.selectAll('.link');

    // Update node visibility with transition
    node.transition()
        .duration(400)
        .style('opacity', d => {
            if (!d.week) return 0.3;
            const nodeYear = d.createdTime.getFullYear();
            const isVisible = nodeYear < currentYear || 
                            (nodeYear === currentYear && d.week <= weekInYear);
            return isVisible ? 1 : 0;
        })
        .style('r', d => {
            if (!d.week) return 8;
            const nodeYear = d.createdTime.getFullYear();
            const isVisible = nodeYear < currentYear || 
                            (nodeYear === currentYear && d.week <= weekInYear);
            return isVisible ? Math.max(12, 10 + d.depth * 3) : 0;
        });

    // Update link visibility
    link.transition()
        .duration(400)
        .style('opacity', l => {
            const sourceVisible = isNodeVisible(l.source, currentYear, weekInYear);
            const targetVisible = isNodeVisible(l.target, currentYear, weekInYear);
            return (sourceVisible && targetVisible) ? 0.8 : 0;
        })
        .style('stroke-width', l => {
            const sourceVisible = isNodeVisible(l.source, currentYear, weekInYear);
            const targetVisible = isNodeVisible(l.target, currentYear, weekInYear);
            return (sourceVisible && targetVisible) ? 2 : 0;
        });
}

function isNodeVisible(node, currentYear, weekInYear) {
    if (!node.createdTime) return false;
    const nodeYear = node.createdTime.getFullYear();
    return nodeYear < currentYear || (nodeYear === currentYear && node.week <= weekInYear);
}

function initializeTimeline(nodes, links, weekRange) {
    if (!weekRange) return;

    const formatDate = date => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const timelineSlider = document.getElementById('timelineSlider');
    const timelineHandle = document.getElementById('timelineHandle');
    const timelineTooltip = document.getElementById('timelineTooltip');
    const timelineProgress = document.getElementById('timelineProgress');
    const timelineStart = document.getElementById('timelineStart');
    const timelineEnd = document.getElementById('timelineEnd');

    // Calculate start and end dates
    const startDate = new Date(weekRange.start.year, 0, 1 + (weekRange.start.week - 1) * 7);
    const endDate = new Date(weekRange.end.year, 0, 1 + (weekRange.end.week - 1) * 7);

    // Set initial dates
    timelineStart.textContent = formatDate(startDate);
    timelineEnd.textContent = formatDate(endDate);

    let isDragging = false;
    let isPlaying = false;
    let currentProgress = 0;

    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        
        const rect = timelineSlider.getBoundingClientRect();
        const progress = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        updateTimelinePosition(progress, nodes, links, weekRange);
        currentProgress = progress;
    }

    function startDragging(e) {
        isDragging = true;
        handleDrag(e);
        e.stopPropagation();
    }

    function stopDragging() {
        isDragging = false;
    }

    // Add click handler for direct clicking on the slider
    timelineSlider.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = timelineSlider.getBoundingClientRect();
        const progress = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        updateTimelinePosition(progress, nodes, links, weekRange);
        currentProgress = progress;
    });

    // Mouse events
    timelineSlider.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Add play button
    const playButton = document.createElement('button');
    playButton.className = 'graph-control-button ml-2';
    playButton.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
    `;
    timelineSlider.parentNode.insertBefore(playButton, timelineSlider);

    function updateProgress() {
        if (!isPlaying) return;
        
        currentProgress += 0.005; // Very slow progression
        if (currentProgress > 100) {
            currentProgress = 0;
            isPlaying = false;
            playButton.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
            return;
        }
        
        // Add delay between updates
        setTimeout(() => {
            updateTimelinePosition(currentProgress, nodes, links, weekRange);
            requestAnimationFrame(() => updateProgress());
        }, 200); // 200ms delay between updates for smoother animation
    }

    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) {
            isPlaying = false;
            playButton.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
        } else {
            isPlaying = true;
            playButton.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
            requestAnimationFrame(updateProgress);
        }
    });

    // Initialize timeline at the start
    updateTimelinePosition(0, nodes, links, weekRange);
}

// Color scale for different types
const colorScale = d3.scaleOrdinal()
    .domain(['page', 'collection_view_page', 'collection'])
    .range(['#60A5FA', '#34D399', '#F472B6']);

// Initialize the graph visualization
function initializeGraph(graphData) {
    try {
        const { nodes, links } = transformDataForGraph(graphData);
        const weekRange = getWeekRange(nodes);
        
        console.log('Graph data transformed:', {
            nodesCount: nodes.length,
            linksCount: links.length,
            weekRange: weekRange,
            sampleNode: nodes[0]
        });
        
        if (nodes.length === 0) {
            console.error('No valid nodes to display');
            return;
        }

        // Get container and clear any existing content
        const container = document.getElementById('graph-container');
        container.innerHTML = ''; // Clear all existing content

        // Recreate the control elements
        container.innerHTML = `
            <div class="graph-controls">
                <button class="graph-control-button" id="zoomIn" title="Zoom In">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                </button>
                <button class="graph-control-button" id="zoomOut" title="Zoom Out">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                </button>
                <button class="graph-control-button" id="resetZoom" title="Reset View">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </button>
            </div>
            <div id="graph-tooltip" class="hidden"></div>
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
        `;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create new SVG with improved dimensions
        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, width, height])
            .attr('class', 'graph-svg');

        // Create single container group for all graph elements
        const g = svg.append('g')
            .attr('class', 'graph-container');

        // Initialize zoom behavior with improved bounds
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        // Apply zoom to SVG and disable double-click zoom
        svg.call(zoom)
           .on('dblclick.zoom', null);

        // Create simulation with improved forces
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(d => 100 + (d.source.depth + d.target.depth) * 20) // Dynamic distance based on depth
                .strength(0.5))
            .force('charge', d3.forceManyBody()
                .strength(d => -2000 - d.depth * 500) // Stronger repulsion for deeper nodes
                .distanceMax(1000))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => 20 + d.depth * 5)) // Dynamic collision radius
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1))
            .alphaDecay(0.002) // Much slower cooling
            .velocityDecay(0.3);

        // Create arrow marker for links with improved size
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-5 -5 10 10')
            .attr('refX', 25) // Adjusted to account for larger nodes
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M -5,-5 L 5,0 L -5,5')
            .attr('fill', '#999');

        // Create links with improved visibility
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Create nodes with improved sizing
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('class', 'node')
            .attr('r', d => Math.max(12, 10 + d.depth * 3)) // Larger base size
            .attr('fill', d => colorScale(d.type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(drag(simulation));

        // Initialize timeline if we have date information
        if (weekRange) {
            initializeTimeline(nodes, links, weekRange);
        }

        // Update positions on each tick with bounds checking
        simulation.on('tick', () => {
            link
                .attr('x1', d => Math.max(0, Math.min(width, d.source.x)))
                .attr('y1', d => Math.max(0, Math.min(height, d.source.y)))
                .attr('x2', d => Math.max(0, Math.min(width, d.target.x)))
                .attr('y2', d => Math.max(0, Math.min(height, d.target.y)));

            node
                .attr('cx', d => Math.max(20, Math.min(width - 20, d.x)))
                .attr('cy', d => Math.max(20, Math.min(height - 20, d.y)));
        });

        // Heat up the simulation periodically to prevent sticking
        let ticker = 0;
        const reheat = setInterval(() => {
            ticker++;
            if (ticker > 200) { // Stop after 200 ticks
                clearInterval(reheat);
                return;
            }
            if (simulation.alpha() < 0.1) {
                simulation.alpha(0.3).restart();
            }
        }, 100);

        // Export necessary variables to window for timeline access
        window._graphState = {
            nodes,
            links,
            weekRange,
            node,
            link
        };

        // Initial zoom fit
        setTimeout(() => {
            const bounds = g.node().getBBox();
            const scale = 0.8 / Math.max(bounds.width / width, bounds.height / height);
            const translate = [
                width / 2 - scale * (bounds.x + bounds.width / 2),
                height / 2 - scale * (bounds.y + bounds.height / 2)
            ];
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
        }, 100);

    } catch (error) {
        console.error('Error in initializeGraph:', error);
        throw error;
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