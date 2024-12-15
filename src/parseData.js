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

        // Add workspace as root node
        nodes.push({
            id: workspaceData.workspace.id,
            name: workspaceData.workspace.name,
            type: 'workspace',
            icon: workspaceData.workspace.icon
        });
        processedIds.add(workspaceData.workspace.id);

        // Process each item
        workspaceData.results.forEach(item => {
            if (processedIds.has(item.id)) return;

            // Add node
            nodes.push({
                id: item.id,
                name: item.title || `Untitled ${item.object}`,
                type: item.object,
                url: item.url,
                last_edited_time: item.last_edited_time,
                created_time: item.created_time,
                parent_type: item.parent?.type
            });
            processedIds.add(item.id);

            // Create links based on parent relationship
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

                if (parentId) {
                    links.push({
                        source: parentId,
                        target: item.id
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
            }, {})
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