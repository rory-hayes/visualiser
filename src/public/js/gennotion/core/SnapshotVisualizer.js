export class SnapshotVisualizer {
    constructor() {
        // Configuration for visualization
        this.SNAPSHOT_INTERVALS = {
            PAST: 60,    // 60 days ago
            PRESENT: 0,  // today
            FUTURE: 90   // 90 days projection
        };

        this.MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
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

            return {
                snapshots,
                visualizationData: this.createVisualization(snapshots)
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

    createVisualization(snapshots) {
        // Create visualization data for each snapshot
        return {
            past: this.createSnapshotVisualization(snapshots.past),
            present: this.createSnapshotVisualization(snapshots.present),
            future: this.createSnapshotVisualization(snapshots.future)
        };
    }

    createSnapshotVisualization(snapshot) {
        // Create a simplified force-directed graph structure
        const nodes = this.aggregateNodes(snapshot.data.nodes);
        const links = this.aggregateConnections(snapshot.connections, nodes);

        return {
            timestamp: snapshot.timestamp,
            metrics: snapshot.metrics,
            visualization: {
                nodes,
                links
            }
        };
    }

    aggregateNodes(nodes) {
        // Group nodes by type or department
        const groupedNodes = new Map();
        
        nodes.forEach(node => {
            const type = node.TYPE || 'unknown';
            if (!groupedNodes.has(type)) {
                groupedNodes.set(type, {
                    id: type,
                    count: 0,
                    size: 0
                });
            }
            const group = groupedNodes.get(type);
            group.count++;
            group.size += 1;
        });

        return Array.from(groupedNodes.values());
    }

    aggregateConnections(connections, nodes) {
        // Create links between node groups based on connection patterns
        const links = [];
        
        nodes.forEach((source, i) => {
            nodes.slice(i + 1).forEach(target => {
                links.push({
                    source: source.id,
                    target: target.id,
                    value: Math.sqrt(source.count * target.count)
                });
            });
        });

        return links;
    }

    // Helper method to format metrics for Notion
    formatSnapshotsForNotion(snapshots) {
        return {
            past: this.formatSnapshotMetrics(snapshots.past, 'Past'),
            present: this.formatSnapshotMetrics(snapshots.present, 'Present'),
            future: this.formatSnapshotMetrics(snapshots.future, 'Future')
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