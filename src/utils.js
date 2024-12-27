export function calculateWorkspaceScore(graph) {
    const { nodes, links } = graph;
    
    // Calculate different aspects of the workspace
    const connectivityScore = calculateConnectivityScore(nodes, links);
    const activityScore = calculateActivityScore(nodes);
    const structureScore = calculateStructureScore(nodes);
    
    // Weight the different aspects
    const score = (
        connectivityScore * 0.4 +  // 40% weight for connectivity
        activityScore * 0.3 +      // 30% weight for activity
        structureScore * 0.3       // 30% weight for structure
    );
    
    return Math.round(Math.max(0, Math.min(100, score)));
}

function calculateConnectivityScore(nodes, links) {
    if (nodes.length === 0) return 0;
    const avgConnectionsPerNode = links.length / nodes.length;
    return Math.min(100, avgConnectionsPerNode * 20); // Scales with connections per node
}

function calculateActivityScore(nodes) {
    if (nodes.length === 0) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const activeNodes = nodes.filter(n => 
        n.lastEdited && new Date(n.lastEdited) >= thirtyDaysAgo
    ).length;
    
    return (activeNodes / nodes.length) * 100;
}

function calculateStructureScore(nodes) {
    if (nodes.length === 0) return 0;
    const maxDepth = Math.max(...nodes.map(n => n.depth || 0));
    // Optimal depth is between 3-5 levels
    const depthScore = maxDepth >= 3 && maxDepth <= 5 ? 100 : 
        Math.max(0, 100 - Math.abs(maxDepth - 4) * 15);
    
    return depthScore;
}

export function calculateMaxDepth(nodes) {
    if (!nodes || nodes.length === 0) return 0;
    
    // Create a map of parent-child relationships
    const parentChildMap = new Map();
    nodes.forEach(node => {
        if (node.parent) {
            const children = parentChildMap.get(node.parent) || [];
            children.push(node.id);
            parentChildMap.set(node.parent, children);
        }
    });
    
    // Function to calculate depth recursively
    function getDepth(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return 0; // Prevent circular references
        visited.add(nodeId);
        
        const children = parentChildMap.get(nodeId) || [];
        if (children.length === 0) return 1;
        
        return 1 + Math.max(...children.map(childId => getDepth(childId, visited)));
    }
    
    // Find root nodes (nodes without parents)
    const rootNodes = nodes.filter(node => !node.parent).map(node => node.id);
    
    // Calculate max depth from any root node
    return Math.max(...rootNodes.map(rootId => getDepth(rootId)));
}