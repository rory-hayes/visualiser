import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export class GraphVisualizer {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.simulation = null;
        this.svg = null;
        this.g = null;
        this.zoom = null;
        this.nodes = [];
        this.links = [];
        
        // Configuration
        this.config = {
            nodeRadius: 8,
            linkDistance: 150,
            chargeStrength: -1000,
            collisionRadius: 30,
            centerForceStrength: 0.3,
            initialZoom: 0.6
        };

        // Color scale for different node types
        this.colorScale = d3.scaleOrdinal()
            .domain(['page', 'collection_view_page', 'collection', 'database', 'table'])
            .range(['#4F46E5', '#10B981', '#EC4899', '#F59E0B', '#6366F1'])
            .unknown('#94A3B8');
    }

    initialize(data) {
        this.setupContainer();
        this.processData(data);
        this.setupSimulation();
        this.render();
        this.setupZoom();
        this.initialZoom();
    }

    setupContainer() {
        // Clear any existing content
        this.container.innerHTML = '';

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', [0, 0, this.width, this.height]);

        // Create main group for zoom
        this.g = this.svg.append('g');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    processData(data) {
        if (!data?.data?.dataframe_2) {
            console.error('Invalid data format');
            return;
        }

        const df2 = data.data.dataframe_2;

        // Process nodes with proper date handling
        this.nodes = df2.map(item => {
            let createdTime = null;
            if (item.CREATED_TIME) {
                const timestamp = typeof item.CREATED_TIME === 'string' ? 
                    parseInt(item.CREATED_TIME) : item.CREATED_TIME;
                createdTime = new Date(timestamp);
            }

            return {
                id: item.ID,
                title: item.TEXT || 'Untitled',
                type: item.TYPE || 'page',
                createdTime,
                parent: item.PARENT_ID,
                depth: Number(item.DEPTH) || 0
            };
        });

        // Create links
        const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
        this.links = this.nodes
            .filter(node => node.parent && nodeMap.has(node.parent))
            .map(node => ({
                source: nodeMap.get(node.parent),
                target: node,
                value: 1
            }));

        // Calculate graph metrics for layout optimization
        const avgDegree = (2 * this.links.length) / this.nodes.length;
        const graphDensity = (2 * this.links.length) / (this.nodes.length * (this.nodes.length - 1));

        // Adjust force parameters based on graph metrics
        this.config.linkDistance = Math.max(100, Math.min(200, 150 / Math.sqrt(graphDensity)));
        this.config.chargeStrength = Math.min(-500, -1000 * Math.sqrt(avgDegree));
    }

    setupSimulation() {
        // Create force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(this.config.linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(this.config.chargeStrength)
                .distanceMax(this.width / 2))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2)
                .strength(this.config.centerForceStrength))
            .force('collision', d3.forceCollide()
                .radius(this.config.collisionRadius))
            .force('x', d3.forceX(this.width / 2).strength(0.1))
            .force('y', d3.forceY(this.height / 2).strength(0.1))
            .alphaDecay(0.01)
            .velocityDecay(0.3);
    }

    render() {
        // Create links
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value));

        // Create nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(this.nodes)
            .join('circle')
            .attr('r', this.config.nodeRadius)
            .attr('fill', d => this.colorScale(d.type))
            .call(this.drag(this.simulation));

        // Add labels with better positioning and collision detection
        const labels = this.g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(this.nodes)
            .join('text')
            .attr('dx', 12)
            .attr('dy', 4)
            .text(d => d.title?.substring(0, 20))
            .style('font-size', '10px')
            .style('fill', '#666')
            .each(function(d) {
                const bbox = this.getBBox();
                d.labelWidth = bbox.width;
                d.labelHeight = bbox.height;
            });

        // Add tooltips
        this.setupTooltips(node);

        // Update positions on each tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x = Math.max(this.config.nodeRadius, Math.min(this.width - this.config.nodeRadius, d.x)))
                .attr('cy', d => d.y = Math.max(this.config.nodeRadius, Math.min(this.height - this.config.nodeRadius, d.y)));

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // Store references for external access
        this.elements = { link, node, labels };
    }

    setupTooltips(node) {
        const tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background-color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            .style('max-width', '300px')
            .style('z-index', '1000');

        node.on('mouseover', (event, d) => {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <div class="p-2">
                    <strong class="block text-lg mb-1">${d.title}</strong>
                    <span class="block text-sm text-gray-500">Type: ${d.type}</span>
                    ${d.createdTime ? `<span class="block text-sm text-gray-500">Created: ${d.createdTime.toLocaleDateString()}</span>` : ''}
                    <span class="block text-sm text-gray-500">Depth: ${d.depth}</span>
                </div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    }

    setupZoom() {
        // Add zoom controls
        const controls = d3.select(this.container)
            .append('div')
            .attr('class', 'graph-controls absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2');

        controls.append('button')
            .attr('class', 'graph-control-button hover:bg-gray-100')
            .attr('title', 'Zoom In')
            .html('<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>')
            .on('click', () => this.zoomBy(1.2));

        controls.append('button')
            .attr('class', 'graph-control-button hover:bg-gray-100')
            .attr('title', 'Zoom Out')
            .html('<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>')
            .on('click', () => this.zoomBy(0.8));

        controls.append('button')
            .attr('class', 'graph-control-button hover:bg-gray-100')
            .attr('title', 'Reset View')
            .html('<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>')
            .on('click', () => this.resetZoom());
    }

    initialZoom() {
        // Calculate the bounding box of the graph
        const bounds = this.g.node().getBBox();
        
        // Calculate the scale to fit the graph with padding
        const scale = Math.min(
            this.width / (bounds.width * 1.2),
            this.height / (bounds.height * 1.2)
        ) * this.config.initialZoom;

        // Calculate the translation to center the graph
        const translate = [
            (this.width - scale * bounds.width) / 2 - scale * bounds.x,
            (this.height - scale * bounds.height) / 2 - scale * bounds.y
        ];

        // Apply the transform
        this.svg.transition()
            .duration(750)
            .call(
                this.zoom.transform,
                d3.zoomIdentity.translate(...translate).scale(scale)
            );
    }

    zoomBy(factor) {
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, factor);
    }

    resetZoom() {
        this.initialZoom();
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    updateNodesVisibility(currentTime) {
        if (!this.elements) return;

        const { node, link } = this.elements;

        // Update node visibility
        node.style('opacity', d => {
            if (!d.createdTime) return 1;
            return d.createdTime.getTime() <= currentTime.getTime() ? 1 : 0.1;
        });

        // Update link visibility
        link.style('opacity', d => {
            const sourceVisible = !d.source.createdTime || d.source.createdTime.getTime() <= currentTime.getTime();
            const targetVisible = !d.target.createdTime || d.target.createdTime.getTime() <= currentTime.getTime();
            return sourceVisible && targetVisible ? 0.6 : 0.1;
        });
    }

    resize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', [0, 0, this.width, this.height]);

        this.simulation
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .restart();
    }
} 