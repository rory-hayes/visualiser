export class Search {
    constructor(graph) {
        this.graph = graph;
        this.searchInput = document.getElementById('pageSearch');
        this.initialize();
    }

    initialize() {
        if (!this.searchInput) return;

        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterNodes(searchTerm);
            }, 300);
        });
    }

    filterNodes(searchTerm) {
        if (!this.graph || !this.graph.nodes) {
            console.error('Graph not initialized');
            return;
        }

        const nodes = this.graph.nodes;
        nodes.forEach(node => {
            const title = (node.title || node.name || '').toLowerCase();
            const matches = title.includes(searchTerm);
            node.hidden = searchTerm && !matches;
        });

        this.graph.update();
    }
} 