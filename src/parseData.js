export function parseDataToGraph(workspaceData) {
    try {
        console.log('Parsing workspace data structure:', {
            workspace: workspaceData.workspace,
            resultsCount: workspaceData.results?.length,
            databasesCount: workspaceData.databases?.length
        });

        const nodes = [];
        const links = [];
        const processedIds = new Set();
        const nodeMap = new Map();

        // Add workspace as root node
        const workspaceNode = {
            id: workspaceData.workspace.id,
            name: workspaceData.workspace.name,
            type: 'workspace',
            icon: workspaceData.workspace.icon
        };
        nodes.push(workspaceNode);
        processedIds.add(workspaceData.workspace.id);
        nodeMap.set(workspaceData.workspace.id, workspaceNode);

        // First pass: Create all nodes
        workspaceData.results.forEach(item => {
            if (processedIds.has(item.id)) return;

            const node = {
                id: item.id,
                name: item.title || `Untitled ${item.object}`,
                type: item.object,
                url: item.url,
                last_edited_time: item.last_edited_time,
                created_time: item.created_time,
                parent_type: item.parent?.type
            };

            nodes.push(node);
            processedIds.add(item.id);
            nodeMap.set(item.id, node);
        });

        // Second pass: Create links only between existing nodes
        workspaceData.results.forEach(item => {
            if (item.parent) {
                let parentId;
                switch (item.parent.type) {
                    case 'workspace':
                        parentId = workspaceData.workspace.id;
                        break;
                    case 'database_id':
                        parentId = item.parent.database_id;
                        break;
                    case 'page_id':
                        parentId = item.parent.page_id;
                        break;
                }

                // Only create link if both nodes exist
                if (parentId && nodeMap.has(parentId) && nodeMap.has(item.id)) {
                    links.push({
                        source: parentId,
                        target: item.id
                    });
                } else {
                    console.log('Skipping link creation - missing node:', {
                        parentId,
                        itemId: item.id,
                        parentExists: nodeMap.has(parentId),
                        targetExists: nodeMap.has(item.id)
                    });
                }
            }
        });

        console.log('Graph parsing complete:', {
            nodesCount: nodes.length,
            linksCount: links.length,
            nodeTypes: nodes.reduce((acc, node) => {
                acc[node.type] = (acc[node.type] || 0) + 1;
                return acc;
            }, {}),
            missingNodes: links.filter(link => 
                !nodeMap.has(link.source) || !nodeMap.has(link.target)
            ).length
        });

        return {
            nodes,
            links,
            metadata: {
                totalPages: nodes.filter(n => n.type === 'page').length,
                totalDatabases: nodes.filter(n => n.type === 'database').length,
                lastEditTimes: nodes.map(n => n.last_edited_time).filter(Boolean),
                createTimes: nodes.map(n => n.created_time).filter(Boolean)
            }
        };
    } catch (error) {
        console.error('Error parsing workspace data:', error);
        throw error;
    }
}