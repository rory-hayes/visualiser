import { initializeWorkspaceGraph } from './workspace-graph.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReport');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportResults = document.getElementById('reportResults');
    const visualizationContainer = document.getElementById('visualization');
    let currentGraph = null;

    async function handleGenerateReport() {
        try {
            const workspaceIdInput = document.getElementById('workspaceId');
            const workspaceId = workspaceIdInput.value.trim();

            // Validate numeric input
            const numericWorkspaceId = parseInt(workspaceId, 10);
            if (!workspaceId || isNaN(numericWorkspaceId)) {
                showNotification('Please enter a valid numeric Workspace ID', 'error');
                return;
            }

            // Show loading spinner
            loadingSpinner.style.display = 'flex';
            generateReportBtn.disabled = true;
            
            // Update status message
            reportResults.innerHTML = `
                <div class="text-gray-600">
                    Starting report generation...
                </div>
            `;

            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _input_number: numericWorkspaceId })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to generate report');
            }

            // Start polling for results
            const runId = data.runId;
            pollForResults(runId);

            reportResults.innerHTML = `
                <div class="text-green-600 font-medium">
                    Report generation started. Run ID: ${runId}
                    <div class="mt-2">Waiting for results...</div>
                </div>
            `;

        } catch (error) {
            console.error('Error generating report:', error);
            showNotification(error.message, 'error');
            reportResults.innerHTML = `
                <div class="text-red-600 font-medium">
                    Error: ${error.message}
                </div>
            `;
        } finally {
            loadingSpinner.style.display = 'none';
            generateReportBtn.disabled = false;
        }
    }

    async function pollForResults(runId) {
        const maxAttempts = 30; // 5 minutes maximum (10 second intervals)
        let attempts = 0;

        const poll = async () => {
            try {
                // Always fetch from 'latest' instead of using runId
                const response = await fetch('/api/hex-results/latest');
                if (!response.ok) {
                    if (response.status === 404) {
                        // Results not ready yet
                        if (attempts++ < maxAttempts) {
                            reportResults.innerHTML = `
                                <div class="text-gray-600">
                                    Waiting for results... (Attempt ${attempts}/${maxAttempts})
                                </div>
                            `;
                            setTimeout(poll, 10000); // Try again in 10 seconds
                            return;
                        }
                        throw new Error('Timeout waiting for results');
                    }
                    throw new Error('Failed to fetch results');
                }

                const data = await response.json();
                console.log('Received results:', data); // Add debug logging
                
                if (data.success) {
                    updateVisualization(data.data);
                    showNotification('Results received successfully', 'success');
                }
            } catch (error) {
                console.error('Error polling for results:', error);
                reportResults.innerHTML = `
                    <div class="text-red-600 font-medium">
                        Error: ${error.message}
                    </div>
                `;
            }
        };

        // Start polling
        poll();
    }

    function showNotification(message, type = 'success') {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        notificationDiv.textContent = message;

        document.body.appendChild(notificationDiv);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notificationDiv.remove();
        }, 3000);
    }

    async function fetchResults(runId) {
        try {
            const response = await fetch('/api/hex-results');
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }
            const data = await response.json();
            // Update your visualizer with the results
            updateVisualization(data);
        } catch (error) {
            console.error('Error fetching results:', error);
            throw error;
        }
    }

    async function updateVisualization(data) {
        const reportResults = document.getElementById('reportResults');
        const visualizationContainer = document.getElementById('visualization');
        
        try {
            // Clear previous visualization
            visualizationContainer.innerHTML = '';
            
            // Initialize the workspace graph
            if (Array.isArray(data.data)) {
                currentGraph = initializeWorkspaceGraph(visualizationContainer, data.data);
            }

            // Create a formatted display of the metadata and stats
            const formattedHtml = `
                <div class="bg-white rounded-lg p-4 shadow-sm mt-4">
                    <h3 class="text-lg font-semibold mb-2">Workspace Analysis</h3>
                    ${formatResults(data)}
                </div>
            `;
            
            reportResults.innerHTML = formattedHtml;
        } catch (error) {
            console.error('Error updating visualization:', error);
            reportResults.innerHTML = `
                <div class="text-red-600 font-medium">
                    Error displaying results: ${error.message}
                </div>
            `;
        }
    }

    function formatResults(data) {
        if (!data) return '<p class="text-gray-600">No data available</p>';
        
        // Create table view for DataFrame data
        if (Array.isArray(data.data)) {
            const records = data.data;
            // Get all unique columns
            const columns = Array.from(new Set(
                records.flatMap(row => Object.keys(row))
            ));
            
            return `
                <div class="space-y-4">
                    ${data.metadata ? `
                        <div class="border-b pb-2">
                            <h4 class="font-medium">Metadata</h4>
                            <pre class="text-sm bg-gray-50 p-2 rounded">${JSON.stringify(data.metadata, null, 2)}</pre>
                        </div>
                    ` : ''}
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    ${columns.map(col => `
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ${col}
                                        </th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${records.map(row => `
                                    <tr>
                                        ${columns.map(col => `
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${row[col] !== undefined ? row[col] : ''}
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        Total rows: ${records.length}
                    </div>
                </div>
            `;
        }
        
        // Fallback for other formats
        return `<pre class="text-sm bg-gray-50 p-4 rounded overflow-auto">${JSON.stringify(data, null, 2)}</pre>`;
    }

    // Add click event listener to the Generate Report button
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
}); 