import { Graph } from './graph.js';
import { Search } from './search.js';
import { Filters } from './filters.js';
import { Stats } from './stats.js';

export class Dashboard {
    constructor() {
        this.graph = null;
        this.search = null;
        this.filters = null;
        this.stats = null;
        this.data = null;
    }

    async initialize() {
        try {
            const visualization = document.getElementById('visualization');
            if (!visualization) {
                throw new Error('Visualization container not found');
            }

            // Show loading state for stats cards
            this.showStatsLoading();

            // Load data first
            this.data = await this.loadData();
            
            // Initialize components
            await this.initializeComponents(visualization);
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError(error.message);
        }
    }

    async loadData() {
        const response = await fetch('/api/data');
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/auth';
                return;
            }
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }

    async initializeComponents(visualization) {
        // Initialize stats first
        this.stats = new Stats();
        this.stats.updateStats(this.data);

        // Initialize graph
        this.graph = new Graph(visualization, this.data.graph);
        await this.graph.initialize();

        // Initialize search and filters after graph is ready
        this.search = new Search(this.graph);
        this.filters = new Filters(this.graph);
    }

    setupEventListeners() {
        // Setup refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                try {
                    refreshBtn.disabled = true;
                    refreshBtn.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                    `;
                    
                    this.data = await this.loadData();
                    await this.initializeComponents(document.getElementById('visualization'));
                    
                    refreshBtn.innerHTML = 'Refresh Data';
                    refreshBtn.disabled = false;
                } catch (error) {
                    console.error('Error refreshing data:', error);
                    this.showError('Failed to refresh data');
                }
            });
        }
    }

    showError(message) {
        const visualization = document.getElementById('visualization');
        if (visualization) {
            visualization.innerHTML = `
                <div class="p-4 text-red-600 bg-red-100 rounded-lg">
                    <h3 class="font-bold">Error Loading Dashboard</h3>
                    <p>${message}</p>
                    <button onclick="window.location.href='/auth'" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Reconnect to Notion
                    </button>
                </div>
            `;
        }
    }

    showStatsLoading() {
        const statCards = document.querySelectorAll('[id^="workspace"], [id^="total"], [id^="active"], [id^="max"], [id^="total"]');
        statCards.forEach(card => {
            if (card.tagName === 'DIV') {
                card.innerHTML = `
                    <div class="animate-pulse flex space-x-4">
                        <div class="flex-1 space-y-4 py-1">
                            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </div>
                `;
            }
        });
    }
} 