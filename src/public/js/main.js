import { Dashboard } from './modules/dashboard.js';
import { Search } from './modules/search.js';
import { Filters } from './modules/filters.js';
import { Graph } from './modules/graph.js';
import { Stats } from './modules/stats.js';
import { initializePreviewGraph } from './preview-graph.js';
import { InsightsPanel } from './components/InsightsPanel.js';
import { EventManager } from './gennotion/core/EventManager.js';
import { DataProcessor } from './gennotion/core/DataProcessor.js';
import { UIManager } from './gennotion/core/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const isLandingPage = window.location.pathname === '/';

    if (isLandingPage) {
        initializeLandingPage();
        initializePreviewGraph();
    } else {
        initializeDashboard();
    }
});

function initializeLandingPage() {
    const getStartedButton = document.getElementById('getStarted');
    if (getStartedButton) {
        getStartedButton.addEventListener('click', () => {
            window.location.href = '/auth';
        });
    }
}

async function initializeDashboard() {
    const dashboard = new Dashboard();
    await dashboard.initialize();

    // Initialize AI Insights
    console.log('Initializing AI components...');
    const insightsContainer = document.getElementById('aiInsights');
    if (insightsContainer) {
        const insightsPanel = new InsightsPanel(insightsContainer);
        await insightsPanel.initialize();
    } else {
        console.error('AI Insights container not found');
    }
}

async function handleGenerateReport() {
    try {
        const workspaceId = getCurrentWorkspaceId();
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate report');
        }

        // Show success message to user
        showNotification('Report generation started successfully');
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    // Implement this based on your UI framework
    // For example, you could use a toast notification
    console.log(`${type}: ${message}`);
}

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
});

class GenNotion {
    constructor() {
        this.eventManager = new EventManager();
        this.dataProcessor = new DataProcessor();
        this.uiManager = new UIManager();
        this.generateBtn = document.getElementById('generateBtn');
        this.workspaceIdsInput = document.getElementById('workspaceIds');
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupEventHandlers();
    }

    setupEventListeners() {
        this.generateBtn?.addEventListener('click', () => this.handleGenerateReport());
    }

    setupEventHandlers() {
        this.eventManager.setHandlers({
            onMessage: (data) => this.handleEventMessage(data),
            onError: (error) => this.handleEventError(error),
            onProgress: (message, data) => this.handleEventProgress(message, data)
        });
    }

    async handleGenerateReport() {
        try {
            const workspaceIds = this.workspaceIdsInput.value
                .split(',')
                .map(id => id.trim())
                .filter(Boolean);
            
            if (workspaceIds.length === 0) {
                alert('Please enter at least one workspace ID');
                return;
            }

            this.uiManager.showStatus('Initiating report generation...', true);
            
            for (const workspaceId of workspaceIds) {
                await this.processWorkspace(workspaceId);
            }

        } catch (error) {
            console.error('Error generating report:', error);
            this.uiManager.showStatus('Error generating report. Please try again.');
        }
    }

    async processWorkspace(workspaceId) {
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            this.uiManager.showStatus('Checking server status...', true);
            
            const isServerHealthy = await this.checkServerStatus();
            if (!isServerHealthy) {
                this.uiManager.showStatus('Server is not responding. Please try again later.');
                return;
            }

            this.uiManager.showStatus(`Triggering report for workspace ${workspaceId}...`, true);
            
            const response = await this.triggerReport(workspaceId);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to trigger report');
            }

            const data = await response.json();
            
            if (!data.success || !data.runId) {
                throw new Error('Invalid response from server');
            }

            console.log('Report generation triggered:', {
                success: data.success,
                runId: data.runId
            });

            this.uiManager.showStatus(`Report triggered for workspace ${workspaceId}. Waiting for results...`, true);
            
            // Reset data processor and start listening for results
            this.dataProcessor.reset();
            this.eventManager.connect();

        } catch (error) {
            console.error('Error processing workspace:', error);
            let errorMessage = error.message;
            
            if (errorMessage.includes('Hex API Error')) {
                errorMessage += '. Please check your Hex API configuration.';
            } else if (errorMessage.includes('Invalid Hex API key')) {
                errorMessage = 'API key is invalid or expired. Please update your configuration.';
            } else if (errorMessage.includes('Hex project not found')) {
                errorMessage = 'Hex project configuration is incorrect. Please verify the project ID.';
            }
            
            this.uiManager.showStatus(`Error processing workspace ${workspaceId}: ${errorMessage}`, false);
        }
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            return response.ok;
        } catch (error) {
            console.error('Server health check error:', error);
            return false;
        }
    }

    async triggerReport(workspaceId) {
        const requestBody = {
            workspaceId: workspaceId.trim(),
            projectId: '21c6c24a-60e8-487c-b03a-1f04dda4f918'
        };

        console.log('Sending request with body:', requestBody);
        
        return fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
    }

    handleEventMessage(data) {
        const result = this.dataProcessor.processChunk(data);
        
        if (result) {
            this.uiManager.updateProgress(
                result.currentChunk,
                result.totalChunks,
                result.accumulatedRecords,
                result.totalRecords
            );

            if (result.isComplete) {
                const processedData = this.dataProcessor.getProcessedData();
                this.displayResults(processedData);
                this.eventManager.disconnect();
            }
        }
    }

    handleEventError(error) {
        this.uiManager.showStatus(error, false);
    }

    handleEventProgress(message, data) {
        if (data?.totalRecords) {
            this.dataProcessor.setTotalExpectedRecords(data.totalRecords);
        }
        this.uiManager.showStatus(message, true);
    }

    displayResults(response) {
        try {
            if (!response.success || !response.data) {
                throw new Error('Invalid response format');
            }

            this.uiManager.showResults();
            this.uiManager.clearResults();
            
            // TODO: Add metrics display and graph visualization
            // These will be implemented in separate visualization modules
            
            this.uiManager.showStatus('Analysis complete');
        } catch (error) {
            console.error('Error in displayResults:', error);
            this.uiManager.showStatus('Error analyzing data');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GenNotion();
}); 