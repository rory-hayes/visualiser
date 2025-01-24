import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export class GraphVisualizer {
    constructor(container) {
        // Ensure we're using the correct container
        this.container = typeof container === 'string' ? 
            document.getElementById(container) : container;
            
        if (!this.container) {
            throw new Error('Graph container not found');
        }

        // Clear any existing content and ensure proper ID
        this.container.innerHTML = '';
        this.container.id = 'graph-container';
        this.container.className = 'w-full h-[800px] min-h-[800px] lg:h-[1000px] relative bg-gray-50 rounded-lg overflow-hidden';

        // Initialize dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
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
            initialZoom: 0.6,
            chunkSize: 500,
            maxVisibleNodes: 1000,
            clusterThreshold: 50,
            lodThresholds: {
                labels: 0.5,
                details: 0.3
            }
        };

        // Color scale for different node types
        this.colorScale = d3.scaleOrdinal()
            .domain(['page', 'collection_view_page', 'collection', 'database', 'table'])
            .range(['#4F46E5', '#10B981', '#EC4899', '#F59E0B', '#6366F1'])
            .unknown('#94A3B8');

        // Add state tracking
        this.state = {
            processedNodes: 0,
            currentChunk: 0,
            isProcessing: false,
            zoomLevel: 1
        };

        // Initialize quadtree for spatial indexing
        this.quadtree = null;
    }

    async initialize(data) {
        this.setupContainer();
        await this.processDataInChunks(data);
        this.setupSimulation();
        this.setupQuadtree();
        this.render();
        this.setupZoom();
        this.initialZoom();
    }

    setupContainer() {
        // Don't create a new container, just clear the existing one
        this.container.innerHTML = '';

        // Create SVG within the existing container
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
                this.state.zoomLevel = event.transform.k;
                this.g.attr('transform', event.transform);
                
                // Check if we need to switch rendering mode
                if (this.shouldUpdateDetail(event.transform.k)) {
                    this.render();
                }
            });

        this.svg.call(this.zoom);

        // Add graph controls container
        const controls = d3.select(this.container)
            .append('div')
            .attr('class', 'graph-controls absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2');

        // Add zoom controls
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

    async processDataInChunks(data) {
        if (!data?.data?.dataframe_2) {
            console.error('Invalid data format');
            return;
        }

        const df2 = data.data.dataframe_2;
        this.nodes = [];
        this.links = [];
        const nodeMap = new Map();

        // Process nodes in chunks
        for (let i = 0; i < df2.length; i += this.config.chunkSize) {
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
            
            const chunk = df2.slice(i, Math.min(i + this.config.chunkSize, df2.length));
            
            // Process chunk
            chunk.forEach(item => {
                const node = this.createNode(item);
                this.nodes.push(node);
                nodeMap.set(node.id, node);
            });

            this.state.processedNodes = this.nodes.length;
            this.state.currentChunk++;

            // If we have a progress callback, call it
            if (this.onProgress) {
                this.onProgress(this.state.processedNodes, df2.length);
            }
        }

        // Create links after all nodes are processed
        await this.createLinks(nodeMap);
        
        // Initialize clustering
        this.initializeClusters();
    }

    createNode(item) {
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
            depth: Number(item.DEPTH) || 0,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            cluster: null
        };
    }

    async createLinks(nodeMap) {
        const tempLinks = [];
        for (const node of this.nodes) {
            if (node.parent && nodeMap.has(node.parent)) {
                tempLinks.push({
                    source: nodeMap.get(node.parent),
                    target: node,
                    value: 1
                });
            }

            if (tempLinks.length >= this.config.chunkSize) {
                await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
                this.links.push(...tempLinks);
                tempLinks.length = 0;
            }
        }
        if (tempLinks.length > 0) {
            this.links.push(...tempLinks);
        }
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

    setupQuadtree() {
        this.quadtree = d3.quadtree()
            .x(d => d.x)
            .y(d => d.y)
            .addAll(this.nodes);
    }

    initializeClusters() {
        if (this.nodes.length <= this.config.maxVisibleNodes) return;

        const clusters = new Map();
        const gridSize = Math.sqrt(this.width * this.height / this.config.clusterThreshold);

        this.nodes.forEach(node => {
            const gridX = Math.floor(node.x / gridSize);
            const gridY = Math.floor(node.y / gridSize);
            const key = `${gridX},${gridY}`;

            if (!clusters.has(key)) {
                clusters.set(key, {
                    x: (gridX + 0.5) * gridSize,
                    y: (gridY + 0.5) * gridSize,
                    nodes: []
                });
            }
            clusters.get(key).nodes.push(node);
            node.cluster = key;
        });

        this.clusters = clusters;
    }

    render() {
        // Clear previous elements
        this.g.selectAll('*').remove();

        // Determine if we should render clusters
        const shouldCluster = this.state.zoomLevel < this.config.lodThresholds.details 
            && this.nodes.length > this.config.maxVisibleNodes;

        if (shouldCluster) {
            this.renderClusters();
        } else {
            this.renderFullDetail();
        }

        // Update simulation
        this.updateSimulation(shouldCluster);
    }

    renderClusters() {
        const clusterData = Array.from(this.clusters.values())
            .filter(cluster => cluster.nodes.length >= this.config.clusterThreshold);

        // Render cluster nodes
        const clusterNodes = this.g.append('g')
            .attr('class', 'clusters')
            .selectAll('circle')
            .data(clusterData)
            .join('circle')
            .attr('r', d => Math.sqrt(d.nodes.length) * this.config.nodeRadius)
            .attr('fill', '#ccc')
            .attr('opacity', 0.8)
            .call(this.drag(this.simulation));

        // Add cluster labels
        if (this.state.zoomLevel > this.config.lodThresholds.labels) {
            this.g.append('g')
                .attr('class', 'cluster-labels')
                .selectAll('text')
                .data(clusterData)
                .join('text')
                .attr('dx', 12)
                .attr('dy', 4)
                .text(d => `${d.nodes.length} nodes`)
                .style('font-size', '10px')
                .style('fill', '#666');
        }
    }

    renderFullDetail() {
        // Render visible nodes based on current viewport
        const visibleNodes = this.getVisibleNodes();
        
        // Create links
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.getVisibleLinks(visibleNodes))
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value));

        // Create nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(visibleNodes)
            .join('circle')
            .attr('r', this.config.nodeRadius)
            .attr('fill', d => this.colorScale(d.type))
            .call(this.drag(this.simulation));

        // Add labels if zoomed in enough
        if (this.state.zoomLevel > this.config.lodThresholds.labels) {
            const labels = this.g.append('g')
                .attr('class', 'labels')
                .selectAll('text')
                .data(visibleNodes)
                .join('text')
                .attr('dx', 12)
                .attr('dy', 4)
                .text(d => d.title?.substring(0, 20))
                .style('font-size', '10px')
                .style('fill', '#666');

            this.elements = { link, node, labels };
        } else {
            this.elements = { link, node };
        }

        // Setup tooltips only if zoomed in enough
        if (this.state.zoomLevel > this.config.lodThresholds.details) {
            this.setupTooltips(node);
        }
    }

    getVisibleNodes() {
        const transform = d3.zoomTransform(this.svg.node());
        const viewportX = -transform.x / transform.k;
        const viewportY = -transform.y / transform.k;
        const viewportWidth = this.width / transform.k;
        const viewportHeight = this.height / transform.k;

        return this.quadtree.visit((node, x1, y1, x2, y2) => {
            if (!node.length) {
                do {
                    const d = node.data;
                    d.visible = (
                        d.x >= viewportX - this.config.nodeRadius &&
                        d.x < viewportX + viewportWidth + this.config.nodeRadius &&
                        d.y >= viewportY - this.config.nodeRadius &&
                        d.y < viewportY + viewportHeight + this.config.nodeRadius
                    );
                } while (node = node.next);
            }
            return x1 >= viewportX + viewportWidth ||
                   x2 < viewportX ||
                   y1 >= viewportY + viewportHeight ||
                   y2 < viewportY;
        });
    }

    getVisibleLinks(visibleNodes) {
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
        return this.links.filter(l => 
            visibleNodeIds.has(l.source.id) && visibleNodeIds.has(l.target.id)
        );
    }

    updateSimulation(clustered) {
        const data = clustered ? Array.from(this.clusters.values()) : this.getVisibleNodes();
        
        this.simulation.nodes(data);
        
        if (!clustered) {
            this.simulation.force('link')
                .links(this.getVisibleLinks(data));
        }

        this.simulation.alpha(0.3).restart();
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

    shouldUpdateDetail(newZoomLevel) {
        const crossedLabelThreshold = 
            (this.state.zoomLevel < this.config.lodThresholds.labels && newZoomLevel >= this.config.lodThresholds.labels) ||
            (this.state.zoomLevel >= this.config.lodThresholds.labels && newZoomLevel < this.config.lodThresholds.labels);
            
        const crossedDetailThreshold =
            (this.state.zoomLevel < this.config.lodThresholds.details && newZoomLevel >= this.config.lodThresholds.details) ||
            (this.state.zoomLevel >= this.config.lodThresholds.details && newZoomLevel < this.config.lodThresholds.details);
            
        return crossedLabelThreshold || crossedDetailThreshold;
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

    zoomBy(factor) {
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, factor);
    }

    resetZoom() {
        this.initialZoom();
    }
} 