export class Graph {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.simulation = null;
        this.nodes = data.nodes;
        this.links = data.links;
    }

    async initialize() {
        const { generateGraph } = await import('../../generateGraph.js');
        this.simulation = generateGraph(this.container, this.data);
        return this.simulation;
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
} 