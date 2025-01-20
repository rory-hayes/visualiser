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
            const data = JSON.parse(event.data);
            
            // Log the event data received from the stream
            console.log('Received event data:', data);
            
            if (data.type === 'connected') {
                console.log('Connected to results stream');
                return;
            }

            if (data.success && data.data) {
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
                });
                
                // Log the actual results data
                console.log('Final results data:', data.data);
                
                // Hide spinner and update status
                showStatus('Results received!', false);
                
                // Display results
                displayResults(data.data);
                
                // Close event source
                eventSource.close();
            }
        } catch (error) {
            console.error('Error processing event data:', error);
            showStatus('Error processing results. Please try again.', false);
            eventSource.close();
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        showStatus('Error receiving results. Please try again.', false);
        eventSource.close();
    };
}

function displayResults(data) {
    resultsSection.classList.remove('hidden');
    resultsContent.innerHTML = formatResults(data);
    initializeGraph(data);
}

function formatResults(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return '<p class="text-gray-500">No results available</p>';
    }

    // Calculate insights
    const insights = {
        totalPages: data.length,
        typeDistribution: {},
        depthDistribution: {},
        pageDepthDistribution: {},
        collections: data.filter(item => item.TYPE === 'collection').length,
        collectionViews: data.filter(item => item.TYPE === 'collection_view_page').length,
        maxDepth: Math.max(...data.map(item => item.DEPTH)),
        maxPageDepth: Math.max(...data.map(item => item.PAGE_DEPTH)),
        rootPages: data.filter(item => item.DEPTH === 0).length
    };

    // Calculate distributions
    data.forEach(item => {
        insights.typeDistribution[item.TYPE] = (insights.typeDistribution[item.TYPE] || 0) + 1;
        insights.depthDistribution[item.DEPTH] = (insights.depthDistribution[item.DEPTH] || 0) + 1;
        insights.pageDepthDistribution[item.PAGE_DEPTH] = (insights.pageDepthDistribution[item.PAGE_DEPTH] || 0) + 1;
    });

    // Create HTML output
    let html = `
        <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 class="text-2xl font-bold mb-4">Workspace Structure Insights</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="p-4 bg-gray-50 rounded">
                    <h3 class="font-semibold">Overview</h3>
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
                            .map(([type, count]) => `<li>${type}: ${count}</li>`)
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
                <div id="graph-container" class="w-full h-[600px] bg-gray-50 rounded-lg relative">
                    <div id="graph-tooltip" class="hidden absolute bg-white p-2 rounded shadow-lg border text-sm"></div>
                    <div class="absolute top-4 right-4 space-y-2">
                        <button id="zoomIn" class="bg-white p-2 rounded shadow hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </button>
                        <button id="zoomOut" class="bg-white p-2 rounded shadow hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <button id="resetZoom" class="bg-white p-2 rounded shadow hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// Transform data for D3
function transformDataForGraph(data) {
    // Create nodes
    const nodes = data.map(item => ({
        id: item.ID,
        type: item.TYPE,
        depth: item.DEPTH,
        pageDepth: item.PAGE_DEPTH,
        ancestors: JSON.parse(item.ANCESTORS),
        parentId: item.PARENT_ID
    }));

    // Create links from ancestors
    const links = [];
    nodes.forEach(node => {
        if (node.parentId) {
            links.push({
                source: node.parentId,
                target: node.id
            });
        }
    });

    return { nodes, links };
}

// Color scale for different types
const colorScale = d3.scaleOrdinal()
    .domain(['page', 'collection_view_page', 'collection'])
    .range(['#60A5FA', '#34D399', '#F472B6']);

// Initialize the graph visualization
function initializeGraph(data) {
    const { nodes, links } = transformDataForGraph(data);
    
    // Clear existing graph
    d3.select('#graph-container svg').remove();

    // Create SVG container
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Create the force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);

    // Create nodes
    const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => 10 + d.depth * 2)
        .attr('fill', d => colorScale(d.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .call(drag(simulation));

    // Add tooltips
    const tooltip = d3.select('#graph-tooltip');
    
    node.on('mouseover', (event, d) => {
        tooltip
            .style('display', 'block')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
                <div class="font-semibold">${d.type}</div>
                <div>Depth: ${d.depth}</div>
                <div>Page Depth: ${d.pageDepth}</div>
            `);
    })
    .on('mouseout', () => {
        tooltip.style('display', 'none');
    })
    .on('click', (event, d) => {
        // Highlight connected nodes
        const connected = new Set([d.id, ...d.ancestors]);
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
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        // Reset node opacities
        node.attr('opacity', 1);
        link.attr('opacity', 1);
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