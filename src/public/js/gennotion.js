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
        console.log('Starting displayResults with data structure:', {
            hasData: !!data,
            dataType: typeof data,
            dataStructure: data ? Object.keys(data) : null
        });

        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Extract the dataframes with proper error handling
        let graphData = null;
        let insightsData = null;
        
        // Handle different data structures
        if (data && typeof data === 'object') {
            if (data.data?.dataframe_2) {
                graphData = data.data.dataframe_2;
                insightsData = data.data.dataframe_3;
            } else if (data.dataframe_2) {
                graphData = data.dataframe_2;
                insightsData = data.dataframe_3;
            } else if (Array.isArray(data)) {
                graphData = data;
            }
        }

        // Calculate metrics using reportGenerator
        if (graphData && insightsData) {
            const metrics = calculateMetrics(graphData, insightsData);
            
            // Log all metrics by category
            console.log('Calculated Metrics:', {
                sqlMetrics: {
                    total_pages: metrics.total_pages,
                    page_count: metrics.page_count,
                    collections_count: metrics.collections_count,
                    collection_views: metrics.collection_views,
                    public_pages_count: metrics.public_pages_count,
                    connected_tool_count: metrics.connected_tool_count,
                    total_num_members: metrics.total_num_members,
                    total_num_guests: metrics.total_num_guests,
                    total_num_teamspaces: metrics.total_num_teamspaces,
                    num_alive_pages: metrics.num_alive_pages,
                    num_private_pages: metrics.num_private_pages,
                    num_alive_blocks: metrics.num_alive_blocks,
                    num_blocks: metrics.num_blocks,
                    num_alive_collections: metrics.num_alive_collections,
                    total_arr: metrics.total_arr,
                    total_paid_seats: metrics.total_paid_seats
                },
                graphMetrics: {
                    max_depth: metrics.max_depth,
                    avg_depth: metrics.avg_depth,
                    root_pages: metrics.root_pages,
                    orphaned_blocks: metrics.orphaned_blocks,
                    deep_pages_count: metrics.deep_pages_count,
                    template_count: metrics.template_count,
                    linked_database_count: metrics.linked_database_count,
                    duplicate_count: metrics.duplicate_count,
                    bottleneck_count: metrics.bottleneck_count,
                    unfindable_pages: metrics.unfindable_pages
                },
                growthMetrics: {
                    growth_rate: metrics.growth_rate,
                    blocks_created_last_month: metrics.blocks_created_last_month,
                    blocks_created_last_year: metrics.blocks_created_last_year,
                    pages_created_last_month: metrics.pages_created_last_month,
                    monthly_member_growth_rate: metrics.monthly_member_growth_rate,
                    expected_members_in_next_year: metrics.expected_members_in_next_year,
                    monthly_content_growth_rate: metrics.monthly_content_growth_rate
                },
                usageMetrics: {
                    active_users: metrics.active_users,
                    daily_active_users: metrics.daily_active_users,
                    weekly_active_users: metrics.weekly_active_users,
                    monthly_active_users: metrics.monthly_active_users,
                    average_daily_edits: metrics.average_daily_edits,
                    average_weekly_edits: metrics.average_weekly_edits,
                    pages_per_user: metrics.pages_per_user,
                    edits_per_user: metrics.edits_per_user,
                    collaboration_rate: metrics.collaboration_rate,
                    engagement_score: metrics.engagement_score
                },
                combinedMetrics: {
                    nav_complexity: metrics.nav_complexity,
                    duplicate_content_rate: metrics.duplicate_content_rate,
                    percentage_unlinked: metrics.percentage_unlinked,
                    current_collaboration_score: metrics.current_collaboration_score,
                    current_visibility_score: metrics.current_visibility_score,
                    projected_visibility_score: metrics.projected_visibility_score,
                    current_productivity_score: metrics.current_productivity_score,
                    ai_productivity_gain: metrics.ai_productivity_gain,
                    automation_potential: metrics.automation_potential,
                    projected_time_savings: metrics.projected_time_savings,
                    current_organization_score: metrics.current_organization_score,
                    projected_organisation_score: metrics.projected_organisation_score,
                    security_improvement_score: metrics.security_improvement_score,
                    success_improvement: metrics.success_improvement
                },
                roiMetrics: {
                    current_plan: metrics.current_plan,
                    enterprise_plan: metrics.enterprise_plan,
                    enterprise_plan_w_ai: metrics.enterprise_plan_w_ai,
                    '10_percent_increase': metrics['10_percent_increase'],
                    '20_percent_increase': metrics['20_percent_increase'],
                    '50_percent_increase': metrics['50_percent_increase'],
                    '10_percent_increase_w_ai': metrics['10_percent_increase_w_ai'],
                    '20_percent_increase_w_ai': metrics['20_percent_increase_w_ai'],
                    '50_percent_increase_w_ai': metrics['50_percent_increase_w_ai'],
                    enterprise_plan_roi: metrics.enterprise_plan_roi,
                    enterprise_plan_w_ai_roi: metrics.enterprise_plan_w_ai_roi
                }
            });

            // Generate report if template is available
            const template = "# Workspace Analysis Report\n\n" +
                           "## Overview\n" +
                           "Total Pages: [[total_pages]]\n" +
                           "Active Pages: [[num_alive_pages]]\n" +
                           "Collections: [[collections_count]]\n\n" +
                           "## Usage Metrics\n" +
                           "Total Members: [[total_num_members]]\n" +
                           "Total Guests: [[total_num_guests]]\n" +
                           "Connected Tools: [[connected_tool_count]]\n\n" +
                           "## Growth Metrics\n" +
                           "Growth Rate: [[growth_rate]]%\n" +
                           "Monthly Member Growth: [[monthly_member_growth_rate]]%\n\n" +
                           "## ROI Metrics\n" +
                           "Current Plan Cost: $[[current_plan]]\n" +
                           "Enterprise Plan ROI: [[enterprise_plan_roi]]%\n";

            const report = generateReport(template, metrics);
            console.log('Generated Report:', report);
        } else {
            console.warn('Missing required data for metrics calculation');
        }

        // Validate graphData for visualization
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
            console.error('Graph container not found after HTML update');
            showStatus('Error: Graph container not found', false);
            return;
        }

        // Initialize graph immediately
        try {
            initializeGraph(graphData, container);
            
            // Scroll results into view
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Force a resize event to ensure proper dimensions
            window.dispatchEvent(new Event('resize'));
            
            console.log('Graph initialization completed successfully');
        } catch (graphError) {
            console.error('Error initializing graph:', graphError);
            showStatus('Error initializing graph visualization', false);
        }
    } catch (error) {
        console.error('Error in displayResults:', error);
        showStatus('Error displaying results: ' + error.message, false);
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
                type: item.TYPE || 'page',
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

        // Create SVG with zoom support
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior
        const g = svg.append('g');
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Create the force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody()
                .strength(-500)
                .distanceMax(500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1))
            .alphaDecay(0.01)
            .velocityDecay(0.2);

        // Add links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Add nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 8)
            .attr('fill', d => colorScale(d.type))
            .call(drag(simulation));

        // Add labels
        const labels = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .attr('dx', 12)
            .attr('dy', 4)
            .text(d => d.title?.substring(0, 20))
            .style('font-size', '10px')
            .style('fill', '#666');

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

        node.on('mouseover', (event, d) => {
            // Fix node position during hover
            d.fx = d.x;
            d.fy = d.y;
            
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
                
            tooltip.html(`
                <div class="p-2">
                    <strong class="block text-lg mb-1">${d.title}</strong>
                    <span class="block text-sm text-gray-500">Type: ${d.type}</span>
                    ${d.createdTime ? `<span class="block text-sm text-gray-500">Created: ${d.createdTime.toLocaleDateString()}</span>` : ''}
                    ${d.url ? `<a href="${d.url}" target="_blank" class="block mt-2 text-blue-500 hover:text-blue-700">Open in Notion</a>` : ''}
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
            // Release fixed position
            d.fx = null;
            d.fy = null;
            
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);

            // Reset node visibility
            const currentTime = new Date(parseInt(document.getElementById('timelineSlider').value));
            updateNodesVisibility(currentTime, node, link, nodes);
        });

        // Store data for resize handling
        container._graphData = {
            nodes,
            links,
            width,
            height
        };

        // Initial zoom to fit
        const bounds = g.node().getBBox();
        const scale = 0.8 / Math.max(bounds.width / width, bounds.height / height);
        const translate = [
            (width - scale * bounds.width) / 2 - scale * bounds.x,
            (height - scale * bounds.height) / 2 - scale * bounds.y
        ];
        svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));

        // Start simulation with higher alpha
        simulation.alpha(1).restart();

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