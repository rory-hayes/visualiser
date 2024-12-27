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
    
    // Track visited nodes to prevent infinite loops
    const visited = new Set();
    
    function getNodeDepth(node) {
        if (visited.has(node.id)) return 0;
        visited.add(node.id);
        
        // Find all parent references to this node
        const parents = nodes.filter(n => 
            n.children?.includes(node.id) || 
            n.childPages?.includes(node.id) ||
            n.childDatabases?.includes(node.id)
        );
        
        if (parents.length === 0) return 1;
        
        // Calculate max depth through all possible parent paths
        return 1 + Math.max(...parents.map(parent => getNodeDepth(parent)));
    }
    
    // Calculate depth for each node and find the maximum
    return Math.max(...nodes.map(node => getNodeDepth(node)));
}