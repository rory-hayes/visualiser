export class Graph {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.simulation = null;
        this.nodes = data.nodes;
        this.links = data.links;
    }

    async initialize() {
        this.showLoading();
        try {
            const { generateGraph } = await import('../../generateGraph.js');
            this.simulation = generateGraph(this.container, this.data);
            this.hideLoading();
            return this.simulation;
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            console.error('Failed to initialize graph:', error);
        }
    }

    update(data = null) {
        if (data) {
            this.nodes = data.nodes;
            this.links = data.links;
        }
        
        if (this.simulation && this.simulation.update) {
            this.simulation.update({
                nodes: this.nodes.filter(n => !n.hidden),
                links: this.links
            });
        }
    }

    showLoading() {
        // Clear existing content
        this.container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                    <p class="text-gray-600 text-sm">Generating workspace visualization...</p>
                </div>
            </div>
        `;
        this.container.style.position = 'relative';
    }

    hideLoading() {
        // Remove loading spinner if it exists
        const loader = this.container.querySelector('div.absolute');
        if (loader) {
            loader.remove();
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="bg-red-50 p-4 rounded-lg max-w-md text-center">
                    <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h3 class="text-lg font-semibold text-red-800 mb-2">Failed to Load Graph</h3>
                    <p class="text-red-600">${message}</p>
                    <button onclick="window.location.reload()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Try Again
                    </button>
                </div>
            </div>
        `;
        this.container.style.position = 'relative';
    }
} 