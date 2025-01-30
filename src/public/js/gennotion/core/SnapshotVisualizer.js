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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SnapshotVisualizer {
    constructor() {
        // Configuration for visualization
        this.SNAPSHOT_INTERVALS = {
            PAST: 60,    // 60 days ago
            PRESENT: 0,  // today
            FUTURE: 90   // 90 days projection
        };

        this.MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
        
        // Updated D3 visualization configuration
        this.GRAPH_CONFIG = {
            width: 1200,
            height: 800,
            nodeRadius: {
                min: 5,
                max: 20
            },
            colors: scaleOrdinal(schemeCategory10),
            simulation: {
                charge: -100,
                linkDistance: 100,
                centerForce: 0.5
            }
        };

        // Update dimensions
        this.width = this.GRAPH_CONFIG.width;
        this.height = this.GRAPH_CONFIG.height;
        this.maxNodes = 100; // Increased max nodes
        this.maxLinks = 200; // Increased max links
        this.visualizationsDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'visualizations');
        
        // Ensure visualizations directory exists
        if (!fs.existsSync(this.visualizationsDir)) {
            fs.mkdirSync(this.visualizationsDir, { recursive: true });
        }

        // Initialize virtual DOM for server-side rendering
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        this.window = dom.window;
        this.document = this.window.document;
        global.window = this.window;
        global.document = this.document;
    }

    async generateSnapshots(dataframe_2, dataframe_3, dataframe_5) {
        console.log('Generating snapshots with data:', {
            df2Length: dataframe_2?.length || 0,
            df3Present: !!dataframe_3,
            df5Length: dataframe_5?.length || 0
        });

        try {
            // Validate input data
            if (!dataframe_2?.length || !dataframe_3 || !dataframe_5?.length) {
                console.error('Missing or empty input data');
                return {
                    snapshots: {
                        past: await this.createEmptyVisualization('past'),
                        present: await this.createEmptyVisualization('present'),
                        future: await this.createEmptyVisualization('future')
                    }
                };
            }

            // Generate base snapshots
            const baseSnapshots = {
                past: await this.generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5),
                present: await this.generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5),
                future: await this.generateFutureProjection(dataframe_2, dataframe_3, dataframe_5)
            };

            console.log('Base snapshots generated:', {
                pastNodes: baseSnapshots.past?.data?.nodes?.length || 0,
                presentNodes: baseSnapshots.present?.data?.nodes?.length || 0,
                futureNodes: baseSnapshots.future?.data?.nodes?.length || 0
            });

            // Create visualizations and save them
            const snapshots = {
                past: await this.createVisualization(baseSnapshots.past, 'Past State (60 days ago)', 'past'),
                present: await this.createVisualization(baseSnapshots.present, 'Current State', 'present'),
                future: await this.createVisualization(baseSnapshots.future, 'Projected Future (90 days)', 'future')
            };

            console.log('Visualization URLs generated:', {
                past: snapshots.past?.visualization,
                present: snapshots.present?.visualization,
                future: snapshots.future?.visualization
            });

            return { snapshots };
        } catch (error) {
            console.error('Error generating snapshots:', error);
            return {
                snapshots: {
                    past: await this.createEmptyVisualization('past'),
                    present: await this.createEmptyVisualization('present'),
                    future: await this.createEmptyVisualization('future')
                }
            };
        }
    }

    async createVisualization(snapshot, title, type) {
        if (!snapshot || !snapshot.data || !snapshot.connections) {
            console.log(`No data for ${type} visualization`);
            return this.createEmptyVisualization(type);
        }

        try {
            // Generate SVG content
            const svg = this.generateSVG(snapshot.data, snapshot.connections, title);
            
            // Create a unique filename
            const timestamp = Date.now();
            const filename = `${type}_${timestamp}.svg`;
            const filePath = path.join(this.visualizationsDir, filename);
            
            // Log the file path and SVG content
            console.log(`Saving visualization to: ${filePath}`);
            console.log(`SVG content length: ${svg.length}`);
            
            // Save SVG to file
            await fs.promises.writeFile(filePath, svg, 'utf8');
            
            // Verify file was saved
            const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
            console.log(`File saved successfully: ${exists}`);
            
            // Return the snapshot with the URL (using just the path)
            const visualizationUrl = `/visualizations/${filename}`;
            console.log(`Visualization URL: ${visualizationUrl}`);
            
            return {
                ...snapshot,
                visualization: visualizationUrl
            };
        } catch (error) {
            console.error(`Error creating ${type} visualization:`, error);
            return this.createEmptyVisualization(type);
        }
    }

    async createEmptyVisualization(type) {
        const svg = this.generateEmptySVG();
        const timestamp = Date.now();
        const filename = `empty_${type}_${timestamp}.svg`;
        const filePath = path.join(this.visualizationsDir, filename);
        
        await fs.promises.writeFile(filePath, svg, 'utf8');
        
        return {
            timestamp: new Date().toISOString(),
            data: [],
            connections: [],
            metrics: {
                totalNodes: 0,
                totalMembers: 0,
                totalConnections: 0,
                connectionDensity: 0,
                collaborationScore: 0,
                activeNodes: 0,
                silos: 0
            },
            visualization: `/visualizations/${filename}`
        };
    }

    async generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5) {
        console.log('Generating past snapshot...');
        const pastDate = new Date(Date.now() - (this.SNAPSHOT_INTERVALS.PAST * this.MILLISECONDS_PER_DAY));
        
        try {
            // Filter data for past date
            const pastData = {
                nodes: dataframe_2.filter(row => new Date(row.CREATED_TIME) <= pastDate),
                members: dataframe_3.TOTAL_NUM_MEMBERS,
                interactions: dataframe_5.filter(row => new Date(row.LAST_INTERACTION_TIME) <= pastDate)
            };

            console.log('Past snapshot data:', {
                nodesCount: pastData.nodes.length,
                members: pastData.members,
                interactionsCount: pastData.interactions.length
            });

            const connections = this.calculateConnections(pastData.nodes, pastData.interactions);
            const metrics = this.calculateSnapshotMetrics(pastData, connections);

            return {
                timestamp: pastDate.toISOString(),
                data: pastData.nodes,
                connections: pastData.interactions,
                metrics
            };
        } catch (error) {
            console.error('Error generating past snapshot:', error);
            return null;
        }
    }

    async generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5) {
        console.log('Generating present snapshot...');
        try {
            // Use current data
            const presentData = {
                nodes: dataframe_2,
                members: dataframe_3.TOTAL_NUM_MEMBERS,
                interactions: dataframe_5
            };

            console.log('Present snapshot data:', {
                nodesCount: presentData.nodes.length,
                members: presentData.members,
                interactionsCount: presentData.interactions.length
            });

            const connections = this.calculateConnections(presentData.nodes, presentData.interactions);
            const metrics = this.calculateSnapshotMetrics(presentData, connections);

            return {
                timestamp: new Date().toISOString(),
                data: presentData.nodes,
                connections: presentData.interactions,
                metrics
            };
        } catch (error) {
            console.error('Error generating present snapshot:', error);
            return null;
        }
    }

    async generateFutureProjection(dataframe_2, dataframe_3, dataframe_5) {
        console.log('Generating future projection...');
        try {
            // Calculate growth rates based on historical data
            const thirtyDaysAgo = new Date(Date.now() - (30 * this.MILLISECONDS_PER_DAY));
            const recentNodes = dataframe_2.filter(row => new Date(row.CREATED_TIME) >= thirtyDaysAgo);
            const nodeGrowthRate = recentNodes.length / dataframe_2.length;

            // Project future data
            const futureDate = new Date(Date.now() + (this.SNAPSHOT_INTERVALS.FUTURE * this.MILLISECONDS_PER_DAY));
            const projectedNodeCount = Math.round(dataframe_2.length * (1 + nodeGrowthRate));
            
            // Create projected nodes by duplicating existing ones with modifications
            const projectedNodes = dataframe_2.slice(0, projectedNodeCount).map(node => ({
                ...node,
                CREATED_TIME: futureDate.toISOString(),
                PROJECTED: true
            }));

            // Project interactions based on current patterns
            const projectedInteractions = this.projectInteractions(dataframe_5, nodeGrowthRate);

            const futureData = {
                nodes: projectedNodes,
                members: Math.round(dataframe_3.TOTAL_NUM_MEMBERS * (1 + nodeGrowthRate * 0.5)), // Assume slower member growth
                interactions: projectedInteractions
            };

            console.log('Future projection data:', {
                nodesCount: futureData.nodes.length,
                members: futureData.members,
                interactionsCount: futureData.interactions.length
            });

            const connections = this.calculateConnections(futureData.nodes, futureData.interactions);
            const metrics = this.calculateSnapshotMetrics(futureData, connections);

            return {
                timestamp: futureDate.toISOString(),
                data: futureData.nodes,
                connections: futureData.interactions,
                metrics
            };
        } catch (error) {
            console.error('Error generating future projection:', error);
            return null;
        }
    }

    calculateConnections(nodes, interactions) {
        try {
            console.log('Calculating connections for:', {
                nodesCount: nodes?.length || 0,
                interactionsCount: interactions?.length || 0
            });

            if (!nodes?.length || !interactions?.length) {
                return {
                    total: 0,
                    unique: 0,
                    density: 0,
                    averagePerNode: 0
                };
            }

            // Create a map of connections
            const connectionMap = new Map();
            interactions.forEach(interaction => {
                const key = `${interaction.USER_ID}-${interaction.PAGE_ID}`;
                if (!connectionMap.has(key)) {
                    connectionMap.set(key, 0);
                }
                connectionMap.set(key, connectionMap.get(key) + 1);
            });

            const totalConnections = interactions.length;
            const uniqueConnections = connectionMap.size;
            const maxPossibleConnections = nodes.length * (nodes.length - 1);
            const density = maxPossibleConnections > 0 ? uniqueConnections / maxPossibleConnections : 0;
            const averagePerNode = nodes.length > 0 ? totalConnections / nodes.length : 0;

            return {
                total: totalConnections,
                unique: uniqueConnections,
                density: density,
                averagePerNode: averagePerNode
            };
        } catch (error) {
            console.error('Error calculating connections:', error);
            return {
                total: 0,
                unique: 0,
                density: 0,
                averagePerNode: 0
            };
        }
    }

    calculateSnapshotMetrics(data, connections) {
        try {
            console.log('Calculating snapshot metrics for:', {
                nodesCount: data.nodes?.length || 0,
                members: data.members || 0,
                connectionsCount: connections?.total || 0
            });

            const metrics = {
                totalNodes: data.nodes?.length || 0,
                totalMembers: data.members || 0,
                totalConnections: connections?.total || 0,
                connectionDensity: connections?.density || 0,
                silos: this.detectSilos(data.nodes, data.interactions),
                activeNodes: this.countActiveNodes(data.nodes),
                collaborationScore: this.calculateCollaborationScore(connections, data.members)
            };

            console.log('Calculated metrics:', metrics);
            return metrics;
        } catch (error) {
            console.error('Error calculating snapshot metrics:', error);
            return {
                totalNodes: 0,
                totalMembers: 0,
                totalConnections: 0,
                connectionDensity: 0,
                silos: 0,
                activeNodes: 0,
                collaborationScore: 0
            };
        }
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

    generateBaseSnapshots(dataframe_2, dataframe_3, dataframe_5) {
        return {
            past: this.generatePastSnapshot(dataframe_2, dataframe_3, dataframe_5),
            present: this.generatePresentSnapshot(dataframe_2, dataframe_3, dataframe_5),
            future: this.generateFutureProjection(dataframe_2, dataframe_3, dataframe_5)
        };
    }

    generateSVG(data, connections, title) {
        console.log('Generating SVG with:', {
            nodesCount: data?.length || 0,
            title
        });

        // Create SVG content with improved visualization
        let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}">`;
        
        // Add white background
        svg += `<rect width="100%" height="100%" fill="#fff"/>`;

        // Extract nodes and links from dataframe_2
        const { nodes, links } = this.extractNodesAndLinks(data);

        console.log('Extracted graph data:', {
            nodesCount: nodes.length,
            linksCount: links.length
        });

        // Set up force simulation with improved parameters
        const simulation = forceSimulation(nodes)
            .force('charge', forceManyBody().strength(this.GRAPH_CONFIG.simulation.charge))
            .force('center', forceCenter(this.width / 2, this.height / 2).strength(this.GRAPH_CONFIG.simulation.centerForce))
            .force('link', forceLink(links).distance(this.GRAPH_CONFIG.simulation.linkDistance))
            .force('collide', forceCollide(30));

        // Run simulation synchronously
        for (let i = 0; i < 100; ++i) simulation.tick();

        // Add links
        links.forEach(link => {
            svg += `<line 
                x1="${Math.round(link.source.x)}" 
                y1="${Math.round(link.source.y)}" 
                x2="${Math.round(link.target.x)}" 
                y2="${Math.round(link.target.y)}" 
                stroke="#999" 
                stroke-width="1"
            />`;
        });

        // Add nodes with improved visualization
        nodes.forEach(node => {
            const radius = this.calculateNodeRadius(node);
            const color = this.getNodeColor(node.type);
            
            // Add node circle
            svg += `<circle 
                cx="${Math.round(node.x)}" 
                cy="${Math.round(node.y)}" 
                r="${radius}" 
                fill="${color}"
                stroke="#fff"
                stroke-width="1.5"
            />`;

            // Add node label if it's a collection or has many connections
            if (node.type === 'collection' || node.connections > 5) {
                svg += `<text 
                    x="${Math.round(node.x)}" 
                    y="${Math.round(node.y + radius + 10)}"
                    text-anchor="middle" 
                    font-size="8" 
                    fill="#666"
                >${node.title || node.type}</text>`;
            }
        });

        // Add title with better styling
        svg += `
            <text 
                x="${this.width/2}" 
                y="30" 
                text-anchor="middle" 
                font-size="20" 
                font-weight="bold" 
                fill="#333"
            >${title}</text>
        `;

        // Add legend
        svg += this.generateLegend();

        svg += '</svg>';
        return svg;
    }

    extractNodesAndLinks(data) {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        console.log('Starting node and link extraction from data:', {
            dataLength: data?.length || 0
        });

        try {
            // First pass: Create all nodes
            data.forEach(item => {
                if (!nodeMap.has(item.ID)) {
                    const node = {
                        id: item.ID,
                        type: item.TYPE || 'page',
                        title: item.TITLE,
                        connections: 0,
                        x: 0,
                        y: 0
                    };
                    nodes.push(node);
                    nodeMap.set(item.ID, node);
                }

                // Also create nodes for parents and collections if they don't exist
                if (item.PARENT_ID && !nodeMap.has(item.PARENT_ID)) {
                    const parentNode = {
                        id: item.PARENT_ID,
                        type: 'page', // Default type for parent
                        title: 'Parent Page',
                        connections: 0,
                        x: 0,
                        y: 0
                    };
                    nodes.push(parentNode);
                    nodeMap.set(item.PARENT_ID, parentNode);
                }

                if (item.COLLECTION_ID && !nodeMap.has(item.COLLECTION_ID)) {
                    const collectionNode = {
                        id: item.COLLECTION_ID,
                        type: 'collection',
                        title: 'Collection',
                        connections: 0,
                        x: 0,
                        y: 0
                    };
                    nodes.push(collectionNode);
                    nodeMap.set(item.COLLECTION_ID, collectionNode);
                }
            });

            console.log('Created nodes:', {
                nodeCount: nodes.length,
                uniqueNodeTypes: [...new Set(nodes.map(n => n.type))]
            });

            // Second pass: Create links only between existing nodes
            data.forEach(item => {
                // Add parent-child relationship
                if (item.PARENT_ID && nodeMap.has(item.PARENT_ID) && nodeMap.has(item.ID)) {
                    links.push({
                        source: nodeMap.get(item.PARENT_ID),
                        target: nodeMap.get(item.ID)
                    });
                    nodeMap.get(item.ID).connections++;
                    nodeMap.get(item.PARENT_ID).connections++;
                }

                // Add collection relationship
                if (item.COLLECTION_ID && nodeMap.has(item.COLLECTION_ID) && nodeMap.has(item.ID)) {
                    links.push({
                        source: nodeMap.get(item.COLLECTION_ID),
                        target: nodeMap.get(item.ID)
                    });
                    nodeMap.get(item.ID).connections++;
                    nodeMap.get(item.COLLECTION_ID).connections++;
                }
            });

            console.log('Created links:', {
                linkCount: links.length,
                nodesWithConnections: nodes.filter(n => n.connections > 0).length
            });

            // Limit the number of nodes and links if necessary
            if (nodes.length > this.maxNodes) {
                // Sort nodes by connections and keep the most connected ones
                nodes.sort((a, b) => b.connections - a.connections);
                const keptNodes = new Set(nodes.slice(0, this.maxNodes).map(n => n.id));
                nodes.length = this.maxNodes;
                
                // Filter links to only include kept nodes
                links = links.filter(link => 
                    keptNodes.has(link.source.id) && keptNodes.has(link.target.id)
                ).slice(0, this.maxLinks);
            }

            return { nodes, links };
        } catch (error) {
            console.error('Error in extractNodesAndLinks:', error);
            return { nodes: [], links: [] };
        }
    }

    generateLegend() {
        const legendX = 50;
        const legendY = this.height - 100;
        const itemHeight = 20;

        let legend = `<g transform="translate(${legendX},${legendY})">`;
        legend += `<rect x="-10" y="-25" width="200" height="100" fill="white" fill-opacity="0.9" stroke="#ccc"/>`;
        
        const types = ['page', 'database', 'collection', 'template'];
        types.forEach((type, i) => {
            const color = this.getNodeColor(type);
            legend += `
                <circle cx="0" cy="${i * itemHeight}" r="5" fill="${color}"/>
                <text x="15" y="${i * itemHeight + 4}" font-size="12">${type}</text>
            `;
        });

        legend += '</g>';
        return legend;
    }

    generateEmptySVG() {
        return `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#fff"/>
            <text 
                x="${this.width/2}" 
                y="${this.height/2}" 
                text-anchor="middle" 
                font-size="24" 
                fill="#666"
            >No data available</text>
        </svg>`;
    }

    getNodeColor(type) {
        const colors = {
            'page': '#4A90E2',
            'database': '#F5A623',
            'collection': '#7ED321',
            'collection_view': '#BD10E0',
            'template': '#9013FE',
            'default': '#9B9B9B'
        };
        return colors[type] || colors.default;
    }
} 