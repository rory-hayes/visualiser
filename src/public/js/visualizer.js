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
        this.resultsContainer.innerHTML = `
            <h2>Report Results</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
    }

    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the visualizer tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VisualizerTool();
}); 