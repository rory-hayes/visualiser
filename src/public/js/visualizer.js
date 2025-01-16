import { initializeWorkspaceGraph } from './workspace-graph.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReport');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportResults = document.getElementById('reportResults');
    const visualizationContainer = document.getElementById('visualization');

    async function handleGenerateReport() {
        try {
            const workspaceIdInput = document.getElementById('workspaceId');
            const spaceIdsText = workspaceIdInput.value.trim();

            // Split and clean the space IDs
            const spaceIds = spaceIdsText
                .split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0);

            // Validate input
            if (spaceIds.length === 0) {
                showNotification('Please enter at least one Space ID', 'error');
                return;
            }

            // UUID validation regex
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const invalidIds = spaceIds.filter(id => !uuidRegex.test(id));
            if (invalidIds.length > 0) {
                showNotification(`Invalid Space ID format: ${invalidIds.join(', ')}`, 'error');
                return;
            }

            // Show loading spinner
            loadingSpinner.style.display = 'flex';
            generateReportBtn.disabled = true;
            
            // Update status message
            reportResults.innerHTML = `
                <div class="text-gray-600">
                    Starting report generation for ${spaceIds.length} space${spaceIds.length > 1 ? 's' : ''}...
                </div>
            `;

            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _input_number: spaceIds[0] }) // For now, just use the first ID
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
                    Report generation started for ${spaceIds.length} space${spaceIds.length > 1 ? 's' : ''}
                    <div class="mt-2">Run ID: ${runId}</div>
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
                // First check the run status
                const statusResponse = await fetch(`/api/hex-status/${runId}`);
                const statusData = await statusResponse.json();
                console.log('Run status:', statusData);

                if (statusData.status === 'FAILED') {
                    throw new Error('Hex project run failed');
                }

                if (statusData.status === 'COMPLETED') {
                    // Once completed, try to fetch results with increasing delays
                    const resultsDelay = Math.min(attempts * 2000, 10000); // Exponential backoff up to 10s
                    await new Promise(resolve => setTimeout(resolve, resultsDelay));

                    const resultsResponse = await fetch('/api/hex-results/latest');
                    if (!resultsResponse.ok) {
                        if (resultsResponse.status === 404) {
                            // Results not ready yet
                            if (attempts++ < maxAttempts) {
                                reportResults.innerHTML = `
                                    <div class="text-gray-600">
                                        <div>Run completed, waiting for results... (Attempt ${attempts}/${maxAttempts})</div>
                                        <div class="text-sm mt-2">
                                            <a href="${statusData.runUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800">
                                                View run details →
                                            </a>
                                        </div>
                                    </div>
                                `;
                                setTimeout(poll, 10000);
                                return;
                            }
                            throw new Error('Timeout waiting for results. The run completed but results were not available. Please try again or check the run details.');
                        }
                        throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
                    }

                    const data = await resultsResponse.json();
                    if (data.success) {
                        displayResults(data);
                        showNotification('Results received successfully', 'success');
                        return;
                    }
                } else {
                    // Still running
                    if (attempts++ < maxAttempts) {
                        reportResults.innerHTML = `
                            <div class="text-gray-600">
                                <div>Processing workspace data... (Attempt ${attempts}/${maxAttempts})</div>
                                <div class="text-sm mt-2">Status: ${statusData.status}</div>
                                ${statusData.runUrl ? `
                                    <div class="text-sm mt-1">
                                        <a href="${statusData.runUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800">
                                            View run details →
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                        setTimeout(poll, 10000);
                        return;
                    }
                    throw new Error('Timeout waiting for run completion');
                }
            } catch (error) {
                console.error('Error polling for results:', error);
                reportResults.innerHTML = `
                    <div class="text-red-600 font-medium">
                        <div>Error: ${error.message}</div>
                        ${statusData?.runUrl ? `
                            <div class="text-sm mt-2">
                                <a href="${statusData.runUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800">
                                    View run details →
                                </a>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        };

        // Start polling
        await poll();
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