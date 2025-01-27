export class Filters {
    constructor(graph) {
        this.graph = graph;
        this.filterButton = document.querySelector('#filterDropdown button');
        this.filterPanel = document.getElementById('filterControls');
        this.filters = document.querySelectorAll('select[id$="Filter"]');
        this.initialize();
    }

    initialize() {
        this.setupFilterPanel();
        this.setupFilterHandlers();
    }

    setupFilterPanel() {
        if (!this.filterButton || !this.filterPanel) return;

        this.filterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.filterPanel.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('#filterDropdown')) {
                this.filterPanel.classList.add('hidden');
            }
        });
    }

    setupFilterHandlers() {
        this.filters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.filterPanel.classList.add('hidden');
                this.applyFilters();
            });
        });
    }

    applyFilters() {
        if (!this.graph || !this.graph.nodes) return;

        const typeFilter = document.getElementById('typeFilter').value;
        const activityFilter = document.getElementById('activityFilter').value;
        const depthFilter = document.getElementById('depthFilter').value;
        const connectionsFilter = document.getElementById('connectionsFilter').value;

        this.graph.nodes.forEach(node => {
            let visible = true;

            // Apply each filter
            if (typeFilter && node.type !== typeFilter) {
                visible = false;
            }

            if (visible && activityFilter) {
                const lastEdited = new Date(node.lastEdited);
                const now = new Date();
                const daysDiff = (now - lastEdited) / (1000 * 60 * 60 * 24);

                switch (activityFilter) {
                    case 'recent': visible = daysDiff <= 7; break;
                    case 'active': visible = daysDiff <= 30; break;
                    case 'stale': visible = daysDiff > 90; break;
                }
            }

            node.hidden = !visible;
        });

        this.graph.update();
    }
} 