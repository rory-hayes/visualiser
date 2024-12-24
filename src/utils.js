export function calculateWorkspaceScore(graph) {
    const { nodes, links } = graph;
    // Simple scoring example - customize based on your needs
    const connectivity = links.length / nodes.length;
    const activeRatio = nodes.filter(n => n.lastEdited && 
        (Date.now() - new Date(n.lastEdited).getTime()) < 30 * 24 * 60 * 60 * 1000).length / nodes.length;
    
    return (connectivity * 50 + activeRatio * 50); // Returns a score from 0-100
}