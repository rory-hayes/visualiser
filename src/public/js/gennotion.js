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
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Create a formatted display of the results
    const formattedResults = formatResults(data);
    resultsContent.innerHTML = formattedResults;
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
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                <h3 class="font-semibold mb-3">Detailed Page List</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depth</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Depth</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Type</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${data.map((item, index) => {
                                const parentPage = data.find(p => p.ID === item.PARENT_PAGE_ID);
                                return `
                                    <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.TYPE}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.DEPTH}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.PAGE_DEPTH}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parentPage ? parentPage.TYPE : 'Root'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    return html;
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