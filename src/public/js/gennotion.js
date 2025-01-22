// Constants
const HEX_PROJECT_ID = '21c6c24a-60e8-487c-b03a-1f04dda4f918';
const HEX_API_URL = 'https://app.hex.tech/api/v1';

import { calculateMetrics, generateReport } from './reportGenerator.js';

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

// Report template
const template = `# Workspace Analysis Report

## Overview
Total Pages: [[total_pages]]
Active Pages: [[num_alive_pages]]
Total Members: [[total_num_members]]

## Growth Metrics
Monthly Growth Rate: [[growth_rate]]%
Content Growth: [[monthly_content_growth_rate]]%
Member Growth: [[monthly_member_growth_rate]]%

## Usage Metrics
Active Users: [[active_users]]
Pages per User: [[pages_per_user]]
Engagement Score: [[engagement_score]]%

## Structure Metrics
Max Depth: [[max_depth]]
Average Depth: [[avg_depth]]
Navigation Score: [[nav_depth_score]]

## Performance Metrics
Organization Score: [[current_organization_score]]
Productivity Score: [[current_productivity_score]]
Collaboration Score: [[current_collaboration_score]]
`;

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

// Process metrics in smaller chunks with cleanup
function processMetricsInChunks(graphData, insightsData, onComplete) {
    const chunkSize = 500; // Reduced chunk size
    const chunks = Math.ceil(graphData.length / chunkSize);
    let processedMetrics = null;
    let currentChunk = 0;

    function processNextChunk() {
        if (currentChunk >= chunks) {
            // All chunks processed
            if (onComplete) {
                onComplete(processedMetrics);
            }
            // Clear references
            processedMetrics = null;
            return;
        }

        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, graphData.length);
        const chunk = graphData.slice(start, end);

        try {
            const chunkMetrics = calculateMetrics(chunk, insightsData);
            processedMetrics = processedMetrics ? mergeMetrics(processedMetrics, chunkMetrics) : chunkMetrics;
        } catch (error) {
            console.error('Error processing chunk:', error);
        }

        // Clear chunk reference
        chunk.length = 0;

        // Process next chunk with delay
        currentChunk++;
        setTimeout(processNextChunk, 10);
    }

    // Start processing
    processNextChunk();
}

// Modified displayResults function
function displayResults(data) {
    try {
        console.log('Starting displayResults');

        // Show results section with loading state
        resultsSection.classList.remove('hidden');
        resultsContent.innerHTML = `
            <div class="workspace-metrics-box">
                <h3>Workspace Metrics</h3>
                <div id="current-nodes-count">
                    Nodes in view: <span id="nodes-count">0</span>
                </div>
            </div>
            <div id="loading-indicator">Loading graph visualization...</div>
            <div id="graph-container"></div>
        `;

        // Extract data with cleanup
        let graphData = null;
        let insightsData = null;
        
        if (data?.data) {
            graphData = data.data.dataframe_2 || [];
            insightsData = data.data.dataframe_3 || {};
            delete data.data.dataframe_2;
            delete data.data.dataframe_3;
        } else if (data?.dataframe_2 || data?.dataframe_3) {
            graphData = data.dataframe_2 || [];
            insightsData = data.dataframe_3 || {};
            delete data.dataframe_2;
            delete data.dataframe_3;
        } else if (Array.isArray(data)) {
            graphData = data;
        }

        // Clear original data reference
        data = null;

        if (!graphData || !Array.isArray(graphData)) {
            console.error('Invalid graph data');
            showStatus('Error: Invalid data received', false);
            return;
        }

        const container = document.getElementById('graph-container');
        const loadingIndicator = document.getElementById('loading-indicator');
        
        if (!container || !loadingIndicator) {
            console.error('Required elements not found');
            return;
        }

        // Process metrics with cleanup
        processMetricsInChunks(graphData, insightsData, (metrics) => {
            if (metrics) {
                const report = generateReport(template, metrics);
                
                // Store minimal results
                window._lastResults = { metrics, report };

                // Log to server
                fetch('/api/log-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'final-results',
                        data: { metrics, report }
                    })
                }).catch(console.error);
            }
        });

        // Initialize graph with cleanup
        setTimeout(() => {
            try {
                container.style.display = 'block';
                const cleanup = initializeGraph(graphData, container, (visibleNodes) => {
                    const nodesCountElement = document.getElementById('nodes-count');
                    if (nodesCountElement) {
                        nodesCountElement.textContent = visibleNodes.length;
                    }
                });

                // Store cleanup function
                container._cleanup = cleanup;
                
                loadingIndicator.style.display = 'none';

                // Clear data references
                graphData = null;
                insightsData = null;
            } catch (error) {
                console.error('Error initializing graph:', error);
                loadingIndicator.innerHTML = 'Error loading graph visualization. Please try again.';
            }
        }, 100);

    } catch (error) {
        console.error('Error in displayResults:', error);
        showStatus('Error displaying results: ' + error.message, false);
    }
}

// Helper function to merge metrics from chunks
function mergeMetrics(metrics1, metrics2) {
    const merged = { ...metrics1 };
    for (const [key, value] of Object.entries(metrics2)) {
        if (typeof value === 'number') {
            merged[key] = (merged[key] || 0) + value;
        }
    }
    return merged;
}

// Helper function to transform insights data
function transformInsightsData(data) {
    return {
        num_total_pages: Number(data.num_total_pages || 0),
        num_pages: Number(data.num_pages || 0),
        num_collections: Number(data.num_collections || 0),
        total_num_collection_views: Number(data.total_num_collection_views || 0),
        num_public_pages: Number(data.num_public_pages || 0),
        total_num_integrations: Number(data.total_num_integrations || 0),
        total_num_members: Number(data.total_num_members || 0),
        total_num_guests: Number(data.total_num_guests || 0),
        total_num_teamspaces: Number(data.total_num_teamspaces || 0),
        num_alive_pages: Number(data.num_alive_pages || 0),
        num_private_pages: Number(data.num_private_pages || 0),
        num_alive_blocks: Number(data.num_alive_blocks || 0),
        num_blocks: Number(data.num_blocks || 0),
        num_alive_collections: Number(data.num_alive_collections || 0),
        total_arr: Number(data.total_arr || 0),
        total_paid_seats: Number(data.total_paid_seats || 0),
        current_month_blocks: Number(data.current_month_blocks || 0),
        previous_month_blocks: Number(data.previous_month_blocks || 0),
        current_month_members: Number(data.current_month_members || 0),
        previous_month_members: Number(data.previous_month_members || 0),
        collaborative_pages: Number(data.collaborative_pages || 0),
        num_permission_groups: Number(data.num_permission_groups || 0)
    };
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

            <!-- Usage Metrics -->
            <div class="mb-8 p-4 bg-green-50 rounded-lg">
                <h3 class="font-semibold text-lg text-green-900 mb-3">Usage Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Daily Active Users</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.daily_active_users)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Weekly Active Users</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.weekly_active_users)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Monthly Active Users</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.monthly_active_users)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Pages per User</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.pages_per_user)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Engagement Score</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.engagement_score)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Collaboration Rate</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.collaboration_rate)}%</div>
                    </div>
                </div>
            </div>

            <!-- Growth Metrics -->
            <div class="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-lg text-blue-900 mb-3">Growth Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Growth Rate</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.growth_rate)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Member Growth Rate</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.monthly_member_growth_rate)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Content Growth Rate</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.monthly_content_growth_rate)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Pages Created (Month)</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.pages_created_last_month)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Expected Members (Year)</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.expected_members_in_next_year)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Blocks Created (Year)</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.blocks_created_last_year)}</div>
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="mb-8 p-4 bg-purple-50 rounded-lg">
                <h3 class="font-semibold text-lg text-purple-900 mb-3">Performance Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Organization Score</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.current_organization_score)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Productivity Score</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.current_productivity_score)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Collaboration Score</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.current_collaboration_score)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">AI Productivity Gain</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.ai_productivity_gain)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Automation Potential</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.automation_potential)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Time Savings (hrs)</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.projected_time_savings)}</div>
                    </div>
                </div>
            </div>

            <!-- ROI Metrics -->
            <div class="mb-8 p-4 bg-yellow-50 rounded-lg">
                <h3 class="font-semibold text-lg text-yellow-900 mb-3">ROI Metrics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Current Plan Cost</div>
                        <div class="text-lg font-semibold text-gray-900">$${formatValue(metrics.current_plan)}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Enterprise Plan ROI</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.enterprise_plan_roi)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">Enterprise AI ROI</div>
                        <div class="text-lg font-semibold text-gray-900">${formatValue(metrics.enterprise_plan_w_ai_roi)}%</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">10% Growth Savings</div>
                        <div class="text-lg font-semibold text-gray-900">$${formatValue(metrics['10_percent_increase'])}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">20% Growth Savings</div>
                        <div class="text-lg font-semibold text-gray-900">$${formatValue(metrics['20_percent_increase'])}</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm">
                        <div class="text-sm text-gray-500">50% Growth Savings</div>
                        <div class="text-lg font-semibold text-gray-900">$${formatValue(metrics['50_percent_increase'])}</div>
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
    try {
        const currentDateDisplay = document.getElementById('currentDate');
        if (currentDateDisplay) {
            currentDateDisplay.textContent = currentTime.toLocaleDateString();
        }

        // Count visible nodes for debugging
        let visibleCount = 0;
        let noDateCount = 0;

        // Debug log before update
        console.log('Updating visibility for date:', currentTime.toLocaleDateString(), {
            totalNodes: nodes.length,
            currentTimestamp: currentTime.getTime()
        });

        // Update visibility based on creation time
        node.style('opacity', d => {
            if (!d.createdTime) {
                noDateCount++;
                return 1; // Show nodes without dates
            }

            // Compare timestamps and ensure proper visibility
            const isVisible = d.createdTime.getTime() <= currentTime.getTime();
            if (isVisible) {
                visibleCount++;
                return 1;
            }
            return 0.1;
        });
        
        // Update links visibility only between visible nodes
        link.style('opacity', d => {
            const sourceVisible = !d.source.createdTime || d.source.createdTime.getTime() <= currentTime.getTime();
            const targetVisible = !d.target.createdTime || d.target.createdTime.getTime() <= currentTime.getTime();
            return sourceVisible && targetVisible ? 0.6 : 0.1;
        });

        console.log(`
            Date Range Info:
            Current Time: ${currentTime.toLocaleDateString()}
            Current Timestamp: ${currentTime.getTime()}
            Visible nodes: ${visibleCount}
            Nodes without dates: ${noDateCount}
            Total nodes: ${nodes.length}
        `);

        // Verify visibility counts match expectations
        const expectedVisible = nodes.filter(n => !n.createdTime || n.createdTime.getTime() <= currentTime.getTime()).length;
        if (visibleCount + noDateCount !== expectedVisible) {
            console.warn('Visibility count mismatch:', {
                counted: visibleCount + noDateCount,
                expected: expectedVisible,
                difference: expectedVisible - (visibleCount + noDateCount)
            });
        }

    } catch (error) {
        console.error('Error in updateNodesVisibility:', error);
        console.error('Current Time:', currentTime);
        console.error('Node sample:', node.data()[0]);
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

// Initialize the force-directed graph with memory optimization
function initializeGraph(graphData, container, onVisibilityChange) {
    try {
        // Clean up any existing graph
        if (container._cleanup) {
            container._cleanup();
        }
        d3.select(container).selectAll('*').remove();

        // Create SVG container
        const width = container.clientWidth;
        const height = container.clientHeight;
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Process nodes with minimal data
        const nodes = graphData.map(d => ({
            id: d.ID,
            type: d.TYPE,
            text: d.TEXT || 'Untitled',
            createdTime: d.CREATED_TIME ? new Date(Number(d.CREATED_TIME)) : null,
            parentId: d.PARENT_ID,
            depth: d.DEPTH
        }));

        // Create links with minimal data
        const links = [];
        const nodeMap = new Map();
        nodes.forEach(node => nodeMap.set(node.id, node));
        
        nodes.forEach(node => {
            if (node.parentId && nodeMap.has(node.parentId)) {
                links.push({
                    source: nodeMap.get(node.parentId),
                    target: node
                });
            }
        });

        // Clear references
        nodeMap.clear();
        graphData = null;

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(50))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(20));

        // Create elements
        const g = svg.append('g');
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);

        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('circle')
            .attr('r', 5)
            .attr('fill', d => getNodeColor(d.type));

        node.append('text')
            .text(d => d.text)
            .attr('x', 8)
            .attr('y', 4)
            .style('font-size', '10px');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        
        svg.call(zoom);

        // Simulation tick with minimal object creation
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
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

        // Add time slider
        const timeRange = d3.extent(nodes, d => d.createdTime);
        if (timeRange[0] && timeRange[1]) {
            const sliderContainer = document.createElement('div');
            Object.assign(sliderContainer.style, {
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                background: 'white',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
            container.appendChild(sliderContainer);

            const slider = d3.sliderBottom()
                .min(timeRange[0])
                .max(timeRange[1])
                .width(sliderContainer.clientWidth * 0.9)
                .tickFormat(d3.timeFormat('%Y-%m-%d'))
                .default(timeRange[1])
                .on('onchange', val => {
                    const currentTime = new Date(val);
                    updateVisibility(currentTime);
                });

            d3.select(sliderContainer)
                .append('svg')
                .attr('width', sliderContainer.clientWidth)
                .attr('height', 100)
                .append('g')
                .attr('transform', 'translate(30,30)')
                .call(slider);
        }

        // Visibility update function
        function updateVisibility(currentTime) {
            node.style('display', d => {
                const isVisible = !d.createdTime || d.createdTime <= currentTime;
                return isVisible ? 'block' : 'none';
            });

            link.style('display', d => {
                const sourceVisible = !d.source.createdTime || d.source.createdTime <= currentTime;
                const targetVisible = !d.target.createdTime || d.target.createdTime <= currentTime;
                return sourceVisible && targetVisible ? 'block' : 'none';
            });

            if (onVisibilityChange) {
                const visibleNodes = nodes.filter(n => !n.createdTime || n.createdTime <= currentTime);
                onVisibilityChange(visibleNodes);
            }
        }

        // Initial visibility update
        if (timeRange[0] && timeRange[1]) {
            updateVisibility(timeRange[1]);
        }

        // Return cleanup function
        return () => {
            // Stop simulation
            simulation.stop();
            
            // Remove all elements
            d3.select(container).selectAll('*').remove();
            
            // Clear references
            nodes.length = 0;
            links.length = 0;
            
            // Remove event listeners
            svg.on('.zoom', null);
            node.on('.drag', null);
            
            // Clear container
            container.innerHTML = '';
        };

    } catch (error) {
        console.error('Error in initializeGraph:', error);
        throw error;
    }
}

function getNodeColor(type) {
    const colors = {
        'page': '#4CAF50',
        'collection': '#2196F3',
        'collection_view': '#9C27B0',
        'template': '#FF9800',
        'default': '#757575'
    };
    return colors[type] || colors.default;
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
        const initialTime = new Date(endDate);
        console.log('Setting initial timeline state:', {
            date: initialTime.toLocaleDateString(),
            timestamp: initialTime.getTime()
        });
        updateNodesVisibility(initialTime, node, link, nodes);

        slider.addEventListener('input', (event) => {
            const currentTime = new Date(parseInt(event.target.value));
            // Set to end of selected day
            currentTime.setHours(23, 59, 59, 999);
            console.log('Timeline slider moved:', {
                date: currentTime.toLocaleDateString(),
                timestamp: currentTime.getTime()
            });
            updateNodesVisibility(currentTime, node, link, nodes);
        });

        // Reset visibility when clicking outside nodes
        svg.on('click', (event) => {
            if (event.target.tagName === 'svg') {
                const currentTime = new Date(parseInt(slider.value));
                // Set to end of selected day
                currentTime.setHours(23, 59, 59, 999);
                updateNodesVisibility(currentTime, node, link, nodes);
            }
        });
    } catch (error) {
        console.error('Error in initializeTimeline:', error);
        console.error('Error details:', {
            error: error.message,
            stack: error.stack
        });
    }
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