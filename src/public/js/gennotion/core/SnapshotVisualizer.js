import { 
    forceSimulation, 
    forceManyBody, 
    forceCenter, 
    forceLink, 
    forceCollide,
    scaleOrdinal,
    scaleLinear,
    schemeCategory10
} from 'd3';

import { JSDOM } from 'jsdom';

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
            colors: scaleOrdinal(schemeCategory10),
            simulation: {
                charge: -30,
                linkDistance: 30,
                centerForce: 1
            }
        };

        // Initialize virtual DOM for server-side rendering
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        this.window = dom.window;
        this.document = this.window.document;
        global.window = this.window;
        global.document = this.document;
    }

    async generateSnapshots(dataframe_2, dataframe_3, dataframe_5) {
        try {
            // Validate input data
            if (!dataframe_2?.length || !dataframe_3 || !dataframe_5?.length) {
                console.warn('Missing or invalid data for snapshot generation:', {
                    df2Length: dataframe_2?.length,
                    df3Keys: Object.keys(dataframe_3 || {}),
                    df5Length: dataframe_5?.length
                });
                return {
                    snapshots: {
                        past: this.generateEmptySnapshot('Past'),
                        present: this.generateEmptySnapshot('Present'),
                        future: this.generateEmptySnapshot('Future')
                    },
                    visualizations: {
                        past: this.createEmptyVisualization('Past State (60 days ago)'),
                        present: this.createEmptyVisualization('Current State'),
                        future: this.createEmptyVisualization('Projected Future (90 days)')
                    }
                };
            }

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

            console.log('Generated base snapshots, creating visualizations...');

            // Generate D3 visualizations for each snapshot
            const visualizations = {
                past: this.createD3Graph(snapshots.past, 'Past State (60 days ago)'),
                present: this.createD3Graph(snapshots.present, 'Current State'),
                future: this.createD3Graph(snapshots.future, 'Projected Future (90 days)')
            };

            console.log('Visualizations created:', {
                hasVisPast: !!visualizations.past,
                hasVisPresent: !!visualizations.present,
                hasVisFuture: !!visualizations.future
            });

            // Attach visualizations to snapshots
            snapshots.past.visualization = visualizations.past;
            snapshots.present.visualization = visualizations.present;
            snapshots.future.visualization = visualizations.future;

            return {
                snapshots,
                visualizations
            };
        } catch (error) {
            console.error('Error generating snapshots:', error);
            return {
                snapshots: {
                    past: this.generateEmptySnapshot('Past'),
                    present: this.generateEmptySnapshot('Present'),
                    future: this.generateEmptySnapshot('Future')
                },
                visualizations: {
                    past: this.createEmptyVisualization('Past State (60 days ago)'),
                    present: this.createEmptyVisualization('Current State'),
                    future: this.createEmptyVisualization('Projected Future (90 days)')
                }
            };
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

    createD3Graph(snapshot, title) {
        try {
            console.log(`Creating minimal D3 graph for ${title}...`);
            
            // Create minimal SVG
            const width = 300;
            const height = 200;
            
            // Prepare graph data with extreme sampling
            const graphData = this.prepareGraphData(snapshot);
            console.log(`Prepared graph data for ${title}:`, {
                nodeCount: graphData.nodes.length,
                linkCount: graphData.links.length
            });

            if (!graphData.nodes.length) {
                console.warn(`No nodes found for ${title}, creating empty visualization`);
                return this.createEmptyVisualization(title);
            }

            // Ultra-aggressive node sampling
            const MAX_NODES = 20; // Drastically reduced
            if (graphData.nodes.length > MAX_NODES) {
                const samplingRate = MAX_NODES / graphData.nodes.length;
                graphData.nodes = graphData.nodes.filter(() => Math.random() < samplingRate);
                const nodeIds = new Set(graphData.nodes.map(n => n.id));
                graphData.links = graphData.links.filter(l => 
                    nodeIds.has(l.source) && nodeIds.has(l.target)
                ).slice(0, MAX_NODES * 2);
            }

            // Quick force simulation
            const simulation = forceSimulation(graphData.nodes)
                .force('charge', forceManyBody().strength(-20))
                .force('center', forceCenter(width / 2, height / 2))
                .force('link', forceLink(graphData.links).id(d => d.id).distance(15))
                .stop();

            // Minimal simulation
            for (let i = 0; i < 30; i++) {
                simulation.tick();
            }

            // Generate minimal SVG
            let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
            svg += `<rect width="100%" height="100%" fill="#fff"/>`;

            // Add links with minimal attributes
            graphData.links.forEach(link => {
                svg += `<line x1="${Math.round(link.source.x)}" y1="${Math.round(link.source.y)}" x2="${Math.round(link.target.x)}" y2="${Math.round(link.target.y)}" stroke="#999"/>`;
            });

            // Add nodes with minimal attributes
            graphData.nodes.forEach(node => {
                svg += `<circle cx="${Math.round(node.x)}" cy="${Math.round(node.y)}" r="3" fill="${this.GRAPH_CONFIG.colors(node.group)}"/>`;
            });

            // Add minimal title
            svg += `<text x="${width/2}" y="15" text-anchor="middle" font-size="10">${title}</text>`;
            svg += '</svg>';

            // Compress SVG
            svg = svg.replace(/\s+/g, ' ')
                    .replace(/> </g, '><')
                    .replace(/\s*([<>])\s*/g, '$1')
                    .replace(/\s+$/g, '');

            const base64 = Buffer.from(svg).toString('base64');
            const dataUrl = `data:image/svg+xml;base64,${base64}`;
            
            console.log(`Created minimal visualization for ${title}, URL length: ${dataUrl.length}`);
            
            if (dataUrl.length > 1900) { // Leave some margin for safety
                console.warn(`Visualization still too large (${dataUrl.length} chars), falling back to empty state`);
                return this.createEmptyVisualization(title);
            }
            
            return dataUrl;
        } catch (error) {
            console.error(`Error creating D3 graph for ${title}:`, error);
            return this.createEmptyVisualization(title);
        }
    }

    prepareGraphData(snapshot) {
        try {
            const nodes = [];
            const links = [];
            const nodeMap = new Map();

            // Create nodes with a limit
            const MAX_NODES_TO_PROCESS = 1000;
            snapshot.data.nodes.slice(0, MAX_NODES_TO_PROCESS).forEach(node => {
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

            // Create links with a limit
            const MAX_LINKS_TO_PROCESS = 2000;
            snapshot.data.interactions.slice(0, MAX_LINKS_TO_PROCESS).forEach(interaction => {
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
        } catch (error) {
            console.error('Error preparing graph data:', error);
            return { nodes: [], links: [] };
        }
    }

    calculateNodeRadius(node) {
        const minConnections = 1;
        const maxConnections = Math.max(...Array.from(node.connections));
        const scale = scaleLinear()
            .domain([minConnections, maxConnections])
            .range([this.GRAPH_CONFIG.nodeRadius.min, this.GRAPH_CONFIG.nodeRadius.max]);
        
        return scale(node.connections || minConnections);
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

    generateEmptySnapshot(period) {
        return {
            timestamp: new Date().toISOString(),
            data: {
                nodes: [],
                members: 0,
                interactions: []
            },
            connections: {
                total: 0,
                unique: 0,
                density: 0,
                averagePerNode: 0
            },
            metrics: {
                totalNodes: 0,
                totalMembers: 0,
                totalConnections: 0,
                connectionDensity: 0,
                silos: 0,
                activeNodes: 0,
                collaborationScore: 0
            }
        };
    }

    createEmptyVisualization(title) {
        // Ultra-minimal empty state
        const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><text x="150" y="100" text-anchor="middle" font-size="10">${title}</text></svg>`;
        const base64 = Buffer.from(svg).toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
    }
} 