import { BaseVisualizer } from './BaseVisualizer.js';
import * as d3 from 'd3';

export class SnapshotVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.SNAPSHOT_INTERVALS = {
            PAST: 60,    // 60 days ago
            PRESENT: 0,  // today
            FUTURE: 90   // 90 days projection
        };
        this.MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    }

    async generateSnapshots(dataframe_2, dataframe_3, dataframe_5) {
        try {
            // Validate input data
            this.validateData(dataframe_2);
            if (!dataframe_3 || !dataframe_5) {
                throw new Error('Missing required dataframes');
            }

            // Generate base snapshots
            const baseSnapshots = {
                past: await this.generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5),
                present: await this.generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5),
                future: await this.generateFutureProjection(dataframe_2, dataframe_3, dataframe_5)
            };

            // Create visualizations
            const snapshots = {
                past: await this.createVisualization(baseSnapshots.past, 'Past State (60 days ago)'),
                present: await this.createVisualization(baseSnapshots.present, 'Current State'),
                future: await this.createVisualization(baseSnapshots.future, 'Projected Future (90 days)')
            };

            return { snapshots };
        } catch (error) {
            console.error('Error generating snapshots:', error);
            return {
                snapshots: {
                    past: this.generateEmptyVisualization('past'),
                    present: this.generateEmptyVisualization('present'),
                    future: this.generateEmptyVisualization('future')
                }
            };
        }
    }

    async generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5) {
        const pastDate = new Date(Date.now() - (this.SNAPSHOT_INTERVALS.PAST * this.MILLISECONDS_PER_DAY));
        
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
        const presentData = {
            nodes: dataframe_2,
            members: dataframe_3.TOTAL_NUM_MEMBERS,
            interactions: dataframe_5
        };

        const connections = this.calculateConnections(presentData.nodes, presentData.interactions);
        const metrics = this.calculateSnapshotMetrics(presentData, connections);

        return {
            timestamp: new Date().toISOString(),
            data: presentData,
            connections,
            metrics
        };
    }

    async generateFutureProjection(dataframe_2, dataframe_3, dataframe_5) {
        // Calculate growth rates
        const thirtyDaysAgo = new Date(Date.now() - (30 * this.MILLISECONDS_PER_DAY));
        const recentNodes = dataframe_2.filter(row => new Date(row.CREATED_TIME) >= thirtyDaysAgo);
        const nodeGrowthRate = recentNodes.length / dataframe_2.length;

        // Project future data
        const futureDate = new Date(Date.now() + (this.SNAPSHOT_INTERVALS.FUTURE * this.MILLISECONDS_PER_DAY));
        const projectedNodeCount = Math.round(dataframe_2.length * (1 + nodeGrowthRate));
        
        const projectedNodes = dataframe_2.slice(0, projectedNodeCount).map(node => ({
            ...node,
            CREATED_TIME: futureDate.toISOString(),
            PROJECTED: true
        }));

        const futureData = {
            nodes: projectedNodes,
            members: Math.round(dataframe_3.TOTAL_NUM_MEMBERS * (1 + nodeGrowthRate * 0.5)),
            interactions: this.projectInteractions(dataframe_5, nodeGrowthRate)
        };

        const connections = this.calculateConnections(futureData.nodes, futureData.interactions);
        const metrics = this.calculateSnapshotMetrics(futureData, connections);

        return {
            timestamp: futureDate.toISOString(),
            data: futureData,
            connections,
            metrics
        };
    }

    calculateConnections(nodes, interactions) {
        const nodeMap = new Map(nodes.map(node => [node.ID, node]));
        const connections = new Map();

        interactions.forEach(interaction => {
            const { USER_ID, PAGE_ID } = interaction;
            if (nodeMap.has(PAGE_ID)) {
                const key = `${USER_ID}-${PAGE_ID}`;
                connections.set(key, (connections.get(key) || 0) + 1);
            }
        });

        return {
            total: connections.size,
            unique: new Set([...connections.keys()].map(k => k.split('-')[0])).size,
            density: connections.size / (nodes.length * nodes.length),
            averagePerNode: connections.size / nodes.length
        };
    }

    projectInteractions(interactions, growthRate) {
        return interactions.map(interaction => ({
            ...interaction,
            INTERACTION_COUNT: Math.round(interaction.INTERACTION_COUNT * (1 + growthRate))
        }));
    }

    calculateSnapshotMetrics(data, connections) {
        return {
            totalNodes: data.nodes.length,
            totalMembers: data.members,
            totalConnections: connections.total,
            connectionDensity: connections.density,
            collaborationScore: this.calculateCollaborationScore(connections, data.members),
            activeNodes: this.countActiveNodes(data.nodes),
            silos: this.detectSilos(data.nodes, data.interactions)
        };
    }

    calculateCollaborationScore(connections, totalMembers) {
        if (totalMembers <= 1) return 0;
        const maxPossibleConnections = totalMembers * (totalMembers - 1) / 2;
        return connections.unique / maxPossibleConnections;
    }

    countActiveNodes(nodes) {
        const thirtyDaysAgo = new Date(Date.now() - (30 * this.MILLISECONDS_PER_DAY));
        return nodes.filter(node => new Date(node.LAST_EDITED || node.CREATED_TIME) >= thirtyDaysAgo).length;
    }

    detectSilos(nodes, interactions) {
        const graph = this.buildInteractionGraph(nodes, interactions);
        return this.findDisconnectedComponents(graph);
    }

    buildInteractionGraph(nodes, interactions) {
        const graph = new Map();
        nodes.forEach(node => graph.set(node.ID, new Set()));

        interactions.forEach(interaction => {
            const { USER_ID, PAGE_ID } = interaction;
            if (graph.has(PAGE_ID)) {
                graph.get(PAGE_ID).add(USER_ID);
            }
        });

        return graph;
    }

    findDisconnectedComponents(graph) {
        const visited = new Set();
        let components = 0;

        const dfs = (nodeId) => {
            visited.add(nodeId);
            const connections = graph.get(nodeId) || new Set();
            for (const connectedId of connections) {
                if (!visited.has(connectedId) && graph.has(connectedId)) {
                    dfs(connectedId);
                }
            }
        };

        for (const nodeId of graph.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
                components++;
            }
        }

        return components;
    }

    async createVisualization(snapshot, title) {
        if (!snapshot?.data?.nodes?.length) {
            return this.generateEmptyVisualization(title);
        }

        try {
            // Create force simulation
            const simulation = d3.forceSimulation(snapshot.data.nodes)
                .force('charge', d3.forceManyBody().strength(-50))
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .force('collision', d3.forceCollide().radius(10))
                .stop();

            // Run simulation
            for (let i = 0; i < 300; ++i) simulation.tick();

            // Generate SVG
            let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
            
            // Add definitions
            svg += '<defs>' + this.addSVGFilters() + '</defs>';
            
            // Add background
            svg += `<rect width="100%" height="100%" fill="#f8f9fa"/>`;

            // Add connections
            snapshot.data.nodes.forEach(node => {
                const connections = snapshot.connections || [];
                connections.forEach(conn => {
                    if (conn.source === node.ID || conn.target === node.ID) {
                        const target = snapshot.data.nodes.find(n => 
                            n.ID === (conn.source === node.ID ? conn.target : conn.source)
                        );
                        if (target && this.isValidCoordinate(node) && this.isValidCoordinate(target)) {
                            svg += `<line 
                                x1="${node.x}" 
                                y1="${node.y}" 
                                x2="${target.x}" 
                                y2="${target.y}"
                                stroke="#999"
                                stroke-width="1"
                                stroke-opacity="0.6"
                            />`;
                        }
                    }
                });
            });

            // Add nodes
            snapshot.data.nodes.forEach(node => {
                if (this.isValidCoordinate(node)) {
                    const radius = this.calculateNodeRadius(node);
                    const color = this.getNodeColor(node.type);
                    svg += `<circle 
                        cx="${node.x}"
                        cy="${node.y}"
                        r="${radius}"
                        fill="${color}"
                        stroke="#fff"
                        stroke-width="1"
                    />`;
                }
            });

            // Add title and metrics
            svg = this.addTitle(svg, title);
            svg = this.addMetrics(svg, snapshot.metrics);
            svg = this.addLegend(svg);

            svg += '</svg>';
            return svg;

        } catch (error) {
            console.error('Error creating visualization:', error);
            return this.generateEmptyVisualization(title);
        }
    }

    addMetrics(svg, metrics) {
        const metricsText = [
            `Total Nodes: ${metrics.totalNodes}`,
            `Active Nodes: ${metrics.activeNodes}`,
            `Connection Density: ${(metrics.connectionDensity * 100).toFixed(1)}%`,
            `Collaboration Score: ${(metrics.collaborationScore * 100).toFixed(1)}%`
        ];

        const metricsHtml = metricsText.map((text, i) => 
            `<text x="10" y="${this.height - 80 + (i * 20)}" font-size="12" fill="#666">${text}</text>`
        ).join('');

        return svg.replace('</svg>', `${metricsHtml}</svg>`);
    }

    generateEmptyVisualization(title) {
        return this.addTitle(this.generateEmptySVG(), title);
    }
} 