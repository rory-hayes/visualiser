document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReport');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportResults = document.getElementById('reportResults');

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
                const response = await fetch(`/api/hex-results/${runId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        // Results not ready yet
                        if (attempts++ < maxAttempts) {
                            setTimeout(poll, 10000); // Try again in 10 seconds
                            return;
                        }
                        throw new Error('Timeout waiting for results');
                    }
                    throw new Error('Failed to fetch results');
                }

                const data = await response.json();
                if (data.success) {
                    // Update the visualization with the results
                    updateVisualization(data.data);
                    reportResults.innerHTML = `
                        <div class="bg-white rounded-lg p-4 shadow-sm">
                            <h3 class="text-lg font-semibold mb-2">Report Results</h3>
                            <pre class="text-sm bg-gray-50 p-4 rounded overflow-auto">
                                ${JSON.stringify(data.data, null, 2)}
                            </pre>
                        </div>
                    `;
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

    // Add click event listener to the Generate Report button
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
}); 