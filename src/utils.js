export {
    calculateWorkspaceScore,
    calculateMaxDepth,
    calculateDetailedMetrics,
    calculateAnalytics
};

function calculateWorkspaceScore(graph) {
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

function calculateMaxDepth(nodes) {
    if (!nodes || nodes.length === 0) return 0;
    const visited = new Set();
    
    function getNodeDepth(node) {
        if (visited.has(node.id)) return 0;
        visited.add(node.id);
        
        const parents = nodes.filter(n => 
            n.children?.includes(node.id) || 
            n.childPages?.includes(node.id) ||
            n.childDatabases?.includes(node.id)
        );
        
        if (parents.length === 0) return 1;
        return 1 + Math.max(...parents.map(parent => getNodeDepth(parent)));
    }
    
    return Math.max(...nodes.map(node => getNodeDepth(node)));
}

function calculateDetailedMetrics(graph) {
    const { nodes, links } = graph;
    const now = new Date();

    // Calculate all metrics
    const metrics = {
        // Basic counts
        totalPages: nodes.length,
        pages: nodes.filter(n => n.type === 'page').length,
        databases: nodes.filter(n => n.type === 'database').length,
        
        // Enhanced activity metrics
        last7Days: countRecentEdits(nodes, 7),
        last30Days: countRecentEdits(nodes, 30),
        last90Days: countRecentEdits(nodes, 90),
        activePages: countRecentEdits(nodes, 30),
        recentlyCreated: nodes.filter(n => {
            if (!n.createdTime) return false;
            const daysSinceCreation = (now - new Date(n.createdTime)) / (1000 * 60 * 60 * 24);
            return daysSinceCreation <= 30;
        }).length,
        stalePages: nodes.filter(n => {
            if (!n.lastEdited) return true;
            const daysSinceEdit = (now - new Date(n.lastEdited)) / (1000 * 60 * 60 * 24);
            return daysSinceEdit > 90;
        }).length,
        archivedPages: nodes.filter(n => n.archived).length,
        
        // Structure metrics
        maxDepth: calculateMaxDepth(nodes),
        rootPages: nodes.filter(n => !n.parent).length,
        avgDepth: calculateAverageDepth(nodes),
        subpageCount: nodes.filter(n => n.parent).length,
        deepPages: nodes.filter(n => (n.depth || 0) > 4).length,
        shallowPages: nodes.filter(n => (n.depth || 0) <= 2).length,
        
        // Connectivity metrics
        totalLinks: links.length,
        avgLinks: Number((links.length / nodes.length).toFixed(2)),
        connectedPages: nodes.filter(n => 
            links.some(l => l.source === n.id || l.target === n.id)
        ).length,
        isolatedPages: nodes.filter(n => 
            !links.some(l => l.source === n.id || l.target === n.id)
        ).length,
        highlyConnected: nodes.filter(n =>
            links.filter(l => l.source === n.id || l.target === n.id).length > 5
        ).length,
        bidirectionalLinks: countBidirectionalLinks(links),
        
        // Content analysis
        totalDatabases: nodes.filter(n => n.type === 'database').length,
        linkedDatabases: nodes.filter(n => 
            n.type === 'database' && 
            links.some(l => l.source === n.id || l.target === n.id)
        ).length,
        docPages: nodes.filter(n => n.type === 'page' && !n.isTemplate).length,
        templatePages: nodes.filter(n => n.isTemplate).length,
        emptyPages: nodes.filter(n => !n.content || n.content.length === 0).length,
        richContentPages: nodes.filter(n => 
            n.content && (
                n.content.includes('table') || 
                n.content.includes('image') || 
                n.content.includes('code')
            )
        ).length
    };

    // Calculate component scores with more precise weighting
    const scores = {
        structure: calculateDetailedStructureScore(nodes, metrics),
        activity: calculateDetailedActivityScore(nodes, metrics),
        connectivity: calculateDetailedConnectivityScore(nodes, links, metrics),
        content: calculateDetailedContentScore(nodes, links, metrics)
    };

    return {
        workspaceScore: calculateOverallScore(scores),
        lastUpdated: getMostRecentEdit(nodes),
        metrics,
        scores,
        recommendations: generateRecommendations(metrics, scores)
    };
}

function calculateAnalytics(graph, days = 30) {
    const { nodes, links } = graph;
    const now = new Date();

    return {
        activity: calculateActivityData(nodes, days),
        growth: calculateGrowthData(nodes, days),
        contentTypes: calculateContentTypeData(nodes),
        pageDepth: calculatePageDepthData(nodes),
        activityTimes: calculateActivityTimeData(nodes),
        connections: calculateConnectionData(nodes, links)
    };
}

function calculateActivityData(nodes, days) {
    const now = new Date();
    const daysArray = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - 1 - i));
        return date;
    });

    const edits = daysArray.map(date => {
        return nodes.filter(node => {
            if (!node.lastEdited) return false;
            const editDate = new Date(node.lastEdited);
            return editDate.toDateString() === date.toDateString();
        }).length;
    });

    return {
        labels: daysArray.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        edits: edits
    };
}

function calculateGrowthData(nodes, days) {
    const now = new Date();
    const daysArray = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - 1 - i));
        return date;
    });

    const totalPages = daysArray.map(date => {
        return nodes.filter(node => {
            if (!node.createdTime) return false;
            const createDate = new Date(node.createdTime);
            return createDate <= date;
        }).length;
    });

    return {
        labels: daysArray.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        totalPages: totalPages
    };
}

function calculateContentTypeData(nodes) {
    return {
        pages: nodes.filter(n => n.type === 'page' && !n.isTemplate).length,
        databases: nodes.filter(n => n.type === 'database').length,
        templates: nodes.filter(n => n.isTemplate).length,
        other: nodes.filter(n => !['page', 'database'].includes(n.type) && !n.isTemplate).length
    };
}

function calculatePageDepthData(nodes) {
    const depths = nodes.map(n => n.depth || 0);
    const maxDepth = Math.max(...depths);
    const depthCounts = Array.from({ length: maxDepth + 1 }, (_, i) => {
        return depths.filter(d => d === i).length;
    });

    return {
        labels: Array.from({ length: maxDepth + 1 }, (_, i) => `Level ${i}`),
        counts: depthCounts
    };
}

function calculateActivityTimeData(nodes) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const activityCounts = hours.map(hour => {
        return nodes.filter(node => {
            if (!node.lastEdited) return false;
            const editDate = new Date(node.lastEdited);
            return editDate.getHours() === hour;
        }).length;
    });

    return {
        labels: hours.map(h => `${h}:00`),
        counts: activityCounts
    };
}

function calculateConnectionData(nodes, links) {
    const connectionPoints = nodes.map(node => {
        const incoming = links.filter(l => l.target === node.id).length;
        const outgoing = links.filter(l => l.source === node.id).length;
        return { x: incoming, y: outgoing };
    });

    return {
        points: connectionPoints
    };
}

// Helper functions for basic workspace score
function calculateConnectivityScore(nodes, links) {
    if (nodes.length === 0) return 0;
    const avgConnectionsPerNode = links.length / nodes.length;
    return Math.min(100, avgConnectionsPerNode * 20);
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
    const depthScore = maxDepth >= 3 && maxDepth <= 5 ? 100 : 
        Math.max(0, 100 - Math.abs(maxDepth - 4) * 15);
    return depthScore;
}

// Helper functions for detailed metrics
function calculateDetailedStructureScore(nodes, metrics) {
    if (nodes.length === 0) return 0;
    const depthScore = calculateDepthScore(metrics.maxDepth);
    const hierarchyScore = calculateHierarchyScore(metrics);
    const organizationScore = calculateOrganizationScore(metrics);
    return Math.round(
        depthScore * 0.4 +
        hierarchyScore * 0.3 +
        organizationScore * 0.3
    );
}

function calculateDetailedActivityScore(nodes, metrics) {
    if (nodes.length === 0) return 0;
    const recentActivityScore = (metrics.last30Days / metrics.totalPages) * 100;
    const staleScore = Math.max(0, 100 - (metrics.stalePages / metrics.totalPages) * 200);
    const archiveScore = Math.max(0, 100 - Math.abs(metrics.archivedPages / metrics.totalPages - 0.1) * 300);
    return Math.round(
        recentActivityScore * 0.5 +
        staleScore * 0.3 +
        archiveScore * 0.2
    );
}

function calculateDetailedConnectivityScore(nodes, links, metrics) {
    if (nodes.length === 0) return 0;
    const avgLinksScore = Math.min(100, metrics.avgLinks * 25);
    const isolationScore = Math.max(0, 100 - (metrics.isolatedPages / metrics.totalPages) * 200);
    const bidirectionalScore = (metrics.bidirectionalLinks / metrics.totalLinks) * 100;
    return Math.round(
        avgLinksScore * 0.4 +
        isolationScore * 0.4 +
        bidirectionalScore * 0.2
    );
}

function calculateDetailedContentScore(nodes, links, metrics) {
    if (nodes.length === 0) return 0;
    const richContentScore = (metrics.richContentPages / metrics.totalPages) * 100;
    const emptyScore = Math.max(0, 100 - (metrics.emptyPages / metrics.totalPages) * 200);
    const templateScore = Math.max(0, 100 - Math.abs(metrics.templatePages / metrics.totalPages - 0.1) * 300);
    return Math.round(
        richContentScore * 0.4 +
        emptyScore * 0.4 +
        templateScore * 0.2
    );
}

// Utility functions
function countRecentEdits(nodes, days) {
    const now = new Date();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
    return nodes.filter(n => n.lastEdited && new Date(n.lastEdited) >= cutoff).length;
}

function calculateAverageDepth(nodes) {
    const depths = nodes.map(n => n.depth || 0);
    return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
}

function getMostRecentEdit(nodes) {
    const dates = nodes
        .map(n => n.lastEdited)
        .filter(Boolean)
        .map(d => new Date(d));
    return dates.length ? Math.max(...dates) : null;
}

function calculateOverallScore(scores) {
    // Weighted average with validation
    const weights = {
        structure: 0.3,
        activity: 0.3,
        connectivity: 0.25,
        content: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
        if (typeof scores[key] === 'number' && !isNaN(scores[key])) {
            totalScore += scores[key] * weight;
            totalWeight += weight;
        }
    });

    return Math.round(totalWeight > 0 ? totalScore / totalWeight : 0);
}

function countBidirectionalLinks(links) {
    const linkPairs = new Set();
    let count = 0;

    links.forEach(link => {
        const pair = [link.source, link.target].sort().join('-');
        if (linkPairs.has(pair)) {
            count++;
        } else {
            linkPairs.add(pair);
        }
    });

    return count;
}

function calculateDepthScore(maxDepth) {
    // Optimal depth is between 3-5 levels
    if (maxDepth >= 3 && maxDepth <= 5) return 100;
    if (maxDepth < 3) return Math.max(0, 60 + maxDepth * 13.33);
    return Math.max(0, 100 - (maxDepth - 5) * 15);
}

function calculateHierarchyScore(metrics) {
    const rootRatio = metrics.rootPages / metrics.totalPages;
    const subpageRatio = metrics.subpageCount / metrics.totalPages;

    // Ideal: 5-15% root pages, rest should be well-distributed
    const rootScore = Math.max(0, 100 - Math.abs(rootRatio - 0.1) * 500);
    const distributionScore = subpageRatio * 100;

    return (rootScore + distributionScore) / 2;
}

function calculateOrganizationScore(metrics) {
    const templateRatio = metrics.templatePages / metrics.totalPages;
    const dbRatio = metrics.databases / metrics.totalPages;

    // Ideal: 5-10% templates, 10-20% databases
    const templateScore = Math.max(0, 100 - Math.abs(templateRatio - 0.075) * 800);
    const dbScore = Math.max(0, 100 - Math.abs(dbRatio - 0.15) * 500);

    return (templateScore + dbScore) / 2;
}

function generateRecommendations(metrics, scores) {
    const recommendations = [];

    // Structure recommendations
    if (scores.structure < 70) {
        if (metrics.maxDepth < 3) {
            recommendations.push('Consider organizing content into deeper hierarchies (3-5 levels) for better structure');
        } else if (metrics.maxDepth > 5) {
            recommendations.push('Some content paths are very deep. Consider flattening the structure for easier navigation');
        }
        if (metrics.rootPages > 7) {
            recommendations.push('Large number of root pages detected. Consider grouping related content');
        }
    }

    // Activity recommendations
    if (scores.activity < 70) {
        if (metrics.stalePages > metrics.totalPages * 0.3) {
            recommendations.push('High number of stale pages. Consider reviewing and updating or archiving old content');
        }
        if (metrics.activePages < metrics.totalPages * 0.1) {
            recommendations.push('Low recent activity. Regular updates help maintain workspace relevance');
        }
    }

    // Connectivity recommendations
    if (scores.connectivity < 70) {
        if (metrics.isolatedPages > metrics.totalPages * 0.2) {
            recommendations.push('Many isolated pages detected. Consider adding connections between related content');
        }
        if (metrics.avgLinks < 2) {
            recommendations.push('Low average connections. Consider adding more cross-references between pages');
        }
    }

    // Content recommendations
    if (scores.content < 70) {
        if (metrics.linkedDatabases < metrics.totalDatabases * 0.8) {
            recommendations.push('Some databases are not well integrated. Consider linking them with related content');
        }
        if (metrics.templatePages < metrics.totalPages * 0.05) {
            recommendations.push('Consider creating more templates to standardize content creation');
        }
    }

    return recommendations;
}