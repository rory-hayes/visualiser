import { initializeWorkspaceGraph } from './workspace-graph.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReport');
    const reportResults = document.getElementById('reportResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statsCards = document.getElementById('statsCards');

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

            // Start the Hex run
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

            // Start listening for results
            listenForResults();

            reportResults.innerHTML = `
                <div class="text-green-600 font-medium">
                    Report generation started for ${spaceIds.length} space${spaceIds.length > 1 ? 's' : ''}
                    <div class="mt-2">Run ID: ${data.runId}</div>
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

    function listenForResults() {
        const eventSource = new EventSource('/api/hex-results/stream');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.success) {
                displayResults(data);
                showNotification('Results received successfully', 'success');
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
            reportResults.innerHTML = `
                <div class="text-red-600 font-medium">
                    <div>Error: Failed to receive results. Please try again.</div>
                </div>
            `;
        };
    }

    function displayResults(data) {
        try {
            // Show stats cards section
            statsCards.classList.remove('hidden');

            // Update stats cards with the data
            if (data.data && data.data.length > 0) {
                const stats = data.data[0]; // Get the first row which contains all stats

                // Display the raw JSON data
                reportResults.innerHTML = `
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <h3 class="text-lg font-semibold mb-2">Raw Results</h3>
                        <pre class="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error displaying results:', error);
            reportResults.innerHTML = `
                <div class="text-red-600 font-medium">
                    Error displaying results: ${error.message}
                </div>
            `;
        }
    }

    // Event Listeners
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }

    function showNotification(message, type = 'info') {
        // Implementation of showNotification...
    }
}); 