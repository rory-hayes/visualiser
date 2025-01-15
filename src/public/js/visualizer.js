import { initializeWorkspaceGraph } from './workspace-graph.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReport');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportResults = document.getElementById('reportResults');
    const visualizationContainer = document.getElementById('visualization');

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
                console.log('Received results:', data);
                
                if (data.success) {
                    displayResults(data);
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

    function displayResults(data) {
        try {
            // Show stats cards section
            const statsCards = document.getElementById('statsCards');
            statsCards.classList.remove('hidden');

            // Update stats cards with the data
            if (data.data && data.data.length > 0) {
                const stats = data.data[0]; // Get the first row which contains all stats

                // Overview
                document.getElementById('totalBlocks').textContent = stats.total_blocks.toLocaleString();
                document.getElementById('totalPages').textContent = stats.total_pages.toLocaleString();
                document.getElementById('uniqueBlockTypes').textContent = stats.unique_block_types.toLocaleString();

                // Depth Analysis
                document.getElementById('maxDepth').textContent = stats.max_depth.toLocaleString();
                document.getElementById('avgDepth').textContent = Number(stats.avg_depth).toFixed(1);
                document.getElementById('medianDepth').textContent = Number(stats.median_depth).toFixed(1);
                document.getElementById('maxPageDepth').textContent = stats.max_page_depth.toLocaleString();

                // Block Types
                document.getElementById('pageCount').textContent = stats.page_count.toLocaleString();
                document.getElementById('textBlockCount').textContent = stats.text_block_count.toLocaleString();
                document.getElementById('todoCount').textContent = stats.todo_count.toLocaleString();
                document.getElementById('headerCount').textContent = stats.header_count.toLocaleString();
                document.getElementById('calloutCount').textContent = stats.callout_count.toLocaleString();
                document.getElementById('toggleCount').textContent = stats.toggle_count.toLocaleString();

                // Structure Analysis
                document.getElementById('orphanedBlocks').textContent = stats.orphaned_blocks.toLocaleString();
                document.getElementById('leafBlocks').textContent = stats.leaf_blocks.toLocaleString();
            }

            // Display the raw JSON data
            reportResults.innerHTML = `
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <h3 class="text-lg font-semibold mb-2">Raw Results</h3>
                    <pre class="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        } catch (error) {
            console.error('Error displaying results:', error);
            reportResults.innerHTML = `
                <div class="text-red-600 font-medium">
                    Error displaying results: ${error.message}
                </div>
            `;
        }
    }

    // Add click event listener to the Generate Report button
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
}); 