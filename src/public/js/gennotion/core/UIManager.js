export class UIManager {
    constructor() {
        // Initialize DOM elements
        this.statusSection = document.getElementById('statusSection');
        this.statusText = document.getElementById('statusText');
        this.statusSpinner = document.getElementById('statusSpinner');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');
        this.progressContainer = null;
    }

    showStatus(message, showSpinner = false) {
        if (this.statusSection && this.statusText) {
            this.statusSection.classList.remove('hidden');
            this.statusText.textContent = message;
            
            if (this.statusSpinner) {
                if (showSpinner) {
                    this.statusSpinner.classList.remove('hidden');
                } else {
                    this.statusSpinner.classList.add('hidden');
                }
            }
        } else {
            console.warn('Status elements not found in DOM');
        }
    }

    showProgress(current, total) {
        // First ensure status section is visible
        if (this.statusSection) {
            this.statusSection.classList.remove('hidden');
        }

        // Get or create progress container
        if (!this.progressContainer) {
            this.progressContainer = document.createElement('div');
            this.progressContainer.id = 'progress-container';
            this.progressContainer.className = 'mt-4 bg-white rounded-lg shadow p-4';
            
            // Try to append to status section first
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.appendChild(this.progressContainer);
            } else {
                // Fallback to status section if status element doesn't exist
                this.statusSection?.appendChild(this.progressContainer);
            }
        }

        // Ensure we have valid numbers before formatting
        const currentCount = typeof current === 'number' ? current : 0;
        const totalCount = typeof total === 'number' ? total : 0;

        if (this.progressContainer) {
            const percentage = totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0;
            this.progressContainer.innerHTML = `
                <div class="progress-bar bg-gray-200 rounded-full h-2.5 mb-2">
                    <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                    <span>Processing: ${currentCount.toLocaleString()} / ${totalCount.toLocaleString()}</span>
                    <span>${percentage}%</span>
                </div>
            `;
        }
    }

    updateProgress(currentChunk, totalChunks, recordsProcessed, totalRecords) {
        const progressContainer = document.getElementById('progressContainer');
        if (!progressContainer) return;
    
        const percentage = (currentChunk / totalChunks) * 100;
        
        progressContainer.innerHTML = `
            <div class="mb-2">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Processing chunks: ${currentChunk}/${totalChunks}</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="text-sm text-gray-600">
                <div>Records processed: ${recordsProcessed.toLocaleString()}</div>
                <div>Total records: ${totalRecords.toLocaleString()}</div>
                <div>Remaining: ${(totalRecords - recordsProcessed).toLocaleString()}</div>
            </div>
        `;
    }

    clearResults() {
        if (this.resultsContent) {
            this.resultsContent.innerHTML = '';
        }
        if (this.progressContainer) {
            this.progressContainer.remove();
            this.progressContainer = null;
        }
    }

    showResults() {
        if (this.resultsSection) {
            this.resultsSection.classList.remove('hidden');
        }
    }

    hideResults() {
        if (this.resultsSection) {
            this.resultsSection.classList.add('hidden');
        }
    }

    createGraphContainer() {
        const container = document.createElement('div');
        container.id = 'graph-container';
        container.className = 'w-full h-[800px] min-h-[800px] lg:h-[1000px] relative bg-gray-50 rounded-lg overflow-hidden';
        this.resultsContent?.appendChild(container);
        return container;
    }
} 