class VisualizerTool {
    constructor() {
        this.workspaceInput = document.getElementById('workspaceId');
        this.generateButton = document.getElementById('generateReport');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.resultsContainer = document.getElementById('reportResults');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.generateButton.addEventListener('click', () => this.handleGenerateReport());
    }

    async handleGenerateReport() {
        const workspaceId = this.workspaceInput.value.trim();
        if (!workspaceId) {
            alert('Please enter a workspace ID');
            return;
        }

        this.showLoading(true);
        
        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayResults(data);
        } catch (error) {
            console.error('Error generating report:', error);
            this.displayError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        this.loadingSpinner.style.display = show ? 'flex' : 'none';
        this.generateButton.disabled = show;
    }

    displayResults(data) {
        // Format the results in a more readable way
        const formattedHtml = `
            <div class="space-y-4">
                <div class="bg-white rounded-lg p-4 shadow">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Report Results</h3>
                    <div class="space-y-2">
                        ${this.formatDataSection(data)}
                    </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Metadata</h3>
                    <div class="space-y-2">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Workspace ID:</span> ${data.metadata?.workspace_id || 'N/A'}
                        </p>
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Timestamp:</span> ${data.metadata?.timestamp || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.resultsContainer.innerHTML = formattedHtml;
    }

    formatDataSection(data) {
        if (!data || typeof data !== 'object') {
            return '<p class="text-gray-600">No data available</p>';
        }

        return Object.entries(data)
            .filter(([key]) => key !== 'metadata')
            .map(([key, value]) => {
                return `
                    <div class="mb-2">
                        <p class="text-sm font-medium text-gray-900">${this.formatKey(key)}:</p>
                        <p class="text-sm text-gray-600 ml-2">${this.formatValue(value)}</p>
                    </div>
                `;
            })
            .join('');
    }

    formatKey(key) {
        return key.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatValue(value) {
        if (typeof value === 'object' && value !== null) {
            return `<pre class="text-xs bg-gray-50 p-2 rounded">${JSON.stringify(value, null, 2)}</pre>`;
        }
        return value;
    }

    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p class="text-sm text-red-600">${message}</p>
            </div>
        `;
    }
}

// Initialize the visualizer tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VisualizerTool();
}); 