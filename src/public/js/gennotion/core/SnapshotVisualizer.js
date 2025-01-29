export class SnapshotVisualizer {
    constructor() {
        // Configuration for visualization
        this.SNAPSHOT_INTERVALS = {
            PAST: 60,    // 60 days ago
            PRESENT: 0,  // today
            FUTURE: 90   // 90 days projection
        };

        this.MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
        
        // D3 visualization configuration
        this.GRAPH_CONFIG = {
            width: 800,
            height: 600,
            nodeRadius: {
                min: 3,
                max: 15
            },
            colors: d3.scaleOrdinal(d3.schemeCategory10),
            simulation: {
                charge: -30,
                linkDistance: 30,
                centerForce: 1
            }
        };
    }

    async generateSnapshots(dataframe_2, dataframe_3, dataframe_5) {
        try {
            console.log('Generating snapshots with data:', {
                df2Length: dataframe_2?.length,
                df3Keys: Object.keys(dataframe_3 || {}),
                df5Length: dataframe_5?.length
            });

            const snapshots = {
                past: await this.generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5),
                present: await this.generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5),
                future: await this.generateFutureProjection(dataframe_2, dataframe_3, dataframe_5)
            };

            // Generate D3 visualizations for each snapshot
            const visualizations = await this.createD3Visualizations(snapshots);

            return {
                snapshots,
                visualizations
            };
        } catch (error) {
            console.error('Error generating snapshots:', error);
            throw error;
        }
    }

    async generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5) {
        const pastDate = new Date(Date.now() - (this.SNAPSHOT_INTERVALS.PAST * this.MILLISECONDS_PER_DAY));
        
        // Filter data for past date
        const pastData = {
            nodes: dataframe_2.filter(row => new Date(row.CREATED_TIME) <= pastDate),
            members: dataframe_3.TOTAL_NUM_MEMBERS,
            interactions: dataframe_5.filter(row => new Date(row.LAST_INTERACTION_TIME) <= pastDate)
        };

        const connections = this.calculateConnections(pastData.nodes, pastData.interactions);
        const metrics = this.calculateSnapshotMetrics(pastData, connections);

        return {
            timestamp: pastDate.toISOString(),
            data: pastData,
            connections,
            metrics
        };
    }

    async generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5) {
        const presentDate = new Date();
        
        // Use current data
        const presentData = {
            nodes: dataframe_2,
            members: dataframe_3.TOTAL_NUM_MEMBERS,
            interactions: dataframe_5
        };

        const connections = this.calculateConnections(presentData.nodes, presentData.interactions);
        const metrics = this.calculateSnapshotMetrics(presentData, connections);

        return {
            timestamp: presentDate.toISOString(),
            data: presentData,
            connections,
            metrics
        };
    }

    async generateFutureProjection(dataframe_2, dataframe_3, dataframe_5) {
        const futureDate = new Date(Date.now() + (this.SNAPSHOT_INTERVALS.FUTURE * this.MILLISECONDS_PER_DAY));
        
        // Calculate growth rates
        const growthRates = this.calculateGrowthRates(dataframe_2, dataframe_3, dataframe_5);
        
        // Project future state
        const futureData = {
            nodes: this.projectNodes(dataframe_2, growthRates.nodeGrowth),
            members: Math.round(dataframe_3.TOTAL_NUM_MEMBERS * (1 + growthRates.memberGrowth)),
            interactions: this.projectInteractions(dataframe_5, growthRates.interactionGrowth)
        };

        const connections = this.calculateConnections(futureData.nodes, futureData.interactions);
        const metrics = this.calculateSnapshotMetrics(futureData, connections);

        return {
            timestamp: futureDate.toISOString(),
            data: futureData,
            connections,
            metrics,
            growthRates
        };
    }

    calculateConnections(nodes, interactions) {
        // Calculate total connections
        const totalConnections = interactions.reduce((sum, interaction) => sum + (interaction.INTERACTION_COUNT || 0), 0);
        
        // Calculate unique connections between members
        const uniqueConnections = new Set(
            interactions.map(interaction => `${interaction.USER_ID}-${interaction.PAGE_ID}`)
        ).size;

        // Calculate connection density
        const possibleConnections = nodes.length * (nodes.length - 1) / 2;
        const density = possibleConnections > 0 ? uniqueConnections / possibleConnections : 0;

        return {
            total: totalConnections,
            unique: uniqueConnections,
            density: density,
            averagePerNode: nodes.length > 0 ? totalConnections / nodes.length : 0
        };
    }

    calculateSnapshotMetrics(data, connections) {
        return {
            totalNodes: data.nodes.length,
            totalMembers: data.members,
            totalConnections: connections.total,
            uniqueConnections: connections.unique,
            connectionDensity: connections.density,
            averageConnectionsPerNode: connections.averagePerNode,
            silos: this.detectSilos(data.nodes, data.interactions),
            activeNodes: this.countActiveNodes(data.nodes),
            collaborationScore: this.calculateCollaborationScore(connections, data.members)
        };
    }

    calculateGrowthRates(dataframe_2, dataframe_3, dataframe_5) {
        const thirtyDaysAgo = new Date(Date.now() - (30 * this.MILLISECONDS_PER_DAY));
        const sixtyDaysAgo = new Date(Date.now() - (60 * this.MILLISECONDS_PER_DAY));

        // Calculate node growth
        const recentNodes = dataframe_2.filter(row => new Date(row.CREATED_TIME) > thirtyDaysAgo).length;
        const olderNodes = dataframe_2.filter(row => 
            new Date(row.CREATED_TIME) <= thirtyDaysAgo && 
            new Date(row.CREATED_TIME) > sixtyDaysAgo
        ).length;
        const nodeGrowth = olderNodes > 0 ? (recentNodes - olderNodes) / olderNodes : 0;

        // Calculate member growth (assuming linear growth)
        const memberGrowth = 0.1; // 10% monthly growth assumption if no historical data

        // Calculate interaction growth
        const recentInteractions = dataframe_5.filter(row => new Date(row.LAST_INTERACTION_TIME) > thirtyDaysAgo).length;
        const olderInteractions = dataframe_5.filter(row => 
            new Date(row.LAST_INTERACTION_TIME) <= thirtyDaysAgo && 
            new Date(row.LAST_INTERACTION_TIME) > sixtyDaysAgo
        ).length;
        const interactionGrowth = olderInteractions > 0 ? (recentInteractions - olderInteractions) / olderInteractions : 0;

        return {
            nodeGrowth,
            memberGrowth,
            interactionGrowth
        };
    }

    projectNodes(nodes, growthRate) {
        const projectedCount = Math.round(nodes.length * (1 + growthRate));
        return Array(projectedCount).fill(null).map((_, index) => ({
            ...nodes[index % nodes.length],
            PROJECTED: true
        }));
    }

    projectInteractions(interactions, growthRate) {
        const projectedCount = Math.round(interactions.length * (1 + growthRate));
        return Array(projectedCount).fill(null).map((_, index) => ({
            ...interactions[index % interactions.length],
            PROJECTED: true
        }));
    }

    detectSilos(nodes, interactions) {
        // Simple silo detection based on connection patterns
        const connectionMap = new Map();
        
        interactions.forEach(interaction => {
            if (!connectionMap.has(interaction.USER_ID)) {
                connectionMap.set(interaction.USER_ID, new Set());
            }
            connectionMap.get(interaction.USER_ID).add(interaction.PAGE_ID);
        });

        // Count groups with limited external connections
        let siloCount = 0;
        connectionMap.forEach((connections, userId) => {
            if (connections.size < 5) { // Arbitrary threshold for silo detection
                siloCount++;
            }
        });

        return siloCount;
    }

    countActiveNodes(nodes) {
        const thirtyDaysAgo = new Date(Date.now() - (30 * this.MILLISECONDS_PER_DAY));
        return nodes.filter(node => 
            node.LAST_EDITED_TIME && new Date(node.LAST_EDITED_TIME) > thirtyDaysAgo
        ).length;
    }

    calculateCollaborationScore(connections, totalMembers) {
        if (totalMembers <= 1) return 0;
        
        // Calculate score based on connection density and average connections
        const densityScore = connections.density * 100;
        const connectionsPerMemberScore = Math.min(100, (connections.averagePerNode / totalMembers) * 100);
        
        return (densityScore * 0.6 + connectionsPerMemberScore * 0.4);
    }

    createD3Visualizations(snapshots) {
        return {
            past: this.createD3Graph(snapshots.past, 'Past State (60 days ago)'),
            present: this.createD3Graph(snapshots.present, 'Current State'),
            future: this.createD3Graph(snapshots.future, 'Projected Future (90 days)')
        };
    }

    createD3Graph(snapshot, title) {
        // Create SVG container
        const svg = d3.create('svg')
            .attr('width', this.GRAPH_CONFIG.width)
            .attr('height', this.GRAPH_CONFIG.height)
            .attr('viewBox', [0, 0, this.GRAPH_CONFIG.width, this.GRAPH_CONFIG.height])
            .attr('style', 'max-width: 100%; height: auto;');

        // Prepare graph data
        const graphData = this.prepareGraphData(snapshot);

        // Create force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('charge', d3.forceManyBody().strength(this.GRAPH_CONFIG.simulation.charge))
            .force('center', d3.forceCenter(this.GRAPH_CONFIG.width / 2, this.GRAPH_CONFIG.height / 2))
            .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(this.GRAPH_CONFIG.simulation.linkDistance))
            .force('collide', d3.forceCollide().radius(d => this.calculateNodeRadius(d) + 1));

        // Create links
        const links = svg.append('g')
            .selectAll('line')
            .data(graphData.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value));

        // Create nodes
        const nodes = svg.append('g')
            .selectAll('circle')
            .data(graphData.nodes)
            .join('circle')
            .attr('r', d => this.calculateNodeRadius(d))
            .attr('fill', d => this.GRAPH_CONFIG.colors(d.group))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        // Add title
        svg.append('text')
            .attr('x', this.GRAPH_CONFIG.width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(title);

        // Add tooltips
        nodes.append('title')
            .text(d => `${d.id}\nConnections: ${d.connections}\nType: ${d.group}`);

        // Update positions on simulation tick
        simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

        // Convert SVG to image
        return this.svgToImage(svg.node());
    }

    prepareGraphData(snapshot) {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        // Create nodes
        snapshot.data.nodes.forEach(node => {
            const nodeId = node.ID || node.id;
            if (!nodeMap.has(nodeId)) {
                nodeMap.set(nodeId, {
                    id: nodeId,
                    group: node.TYPE || 'unknown',
                    connections: 0,
                    size: 1
                });
            }
        });

        // Create links and update node connections
        snapshot.data.interactions.forEach(interaction => {
            const sourceId = interaction.USER_ID;
            const targetId = interaction.PAGE_ID;
            
            if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: interaction.INTERACTION_COUNT || 1
                });
                
                nodeMap.get(sourceId).connections++;
                nodeMap.get(targetId).connections++;
            }
        });

        return {
            nodes: Array.from(nodeMap.values()),
            links
        };
    }

    calculateNodeRadius(node) {
        const minConnections = 1;
        const maxConnections = Math.max(...Array.from(node.connections));
        const scale = d3.scaleLinear()
            .domain([minConnections, maxConnections])
            .range([this.GRAPH_CONFIG.nodeRadius.min, this.GRAPH_CONFIG.nodeRadius.max]);
        
        return scale(node.connections || minConnections);
    }

    async svgToImage(svgNode) {
        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svgNode);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        return URL.createObjectURL(svgBlob);
    }

    // Helper method to format metrics for Notion
    formatSnapshotsForNotion(snapshots, visualizations) {
        return {
            past: {
                ...this.formatSnapshotMetrics(snapshots.past, 'Past'),
                visualization: visualizations.past
            },
            present: {
                ...this.formatSnapshotMetrics(snapshots.present, 'Present'),
                visualization: visualizations.present
            },
            future: {
                ...this.formatSnapshotMetrics(snapshots.future, 'Future'),
                visualization: visualizations.future
            }
        };
    }

    formatSnapshotMetrics(snapshot, period) {
        return {
            period,
            timestamp: new Date(snapshot.timestamp).toLocaleDateString(),
            metrics: {
                totalNodes: snapshot.metrics.totalNodes,
                totalMembers: snapshot.metrics.totalMembers,
                totalConnections: snapshot.metrics.totalConnections,
                connectionDensity: (snapshot.metrics.connectionDensity * 100).toFixed(1) + '%',
                silos: snapshot.metrics.silos,
                activeNodes: snapshot.metrics.activeNodes,
                collaborationScore: snapshot.metrics.collaborationScore.toFixed(1)
            }
        };
    }
} 