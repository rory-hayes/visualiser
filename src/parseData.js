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

        // Helper function to add a node
        function addNode(item) {
            if (!processedIds.has(item.id)) {
                const node = {
                    id: item.id,
                    title: item.properties?.title?.title?.[0]?.plain_text || 
                           item.title?.plain_text || 
                           'Untitled',
                    type: item.object,
                    parent_id: item.parent?.page_id || 
                              item.parent?.database_id || 
                              (item.parent?.type === 'workspace' ? 'workspace' : null),
                    lastEdited: item.last_edited_time,
                    created: item.created_time,
                    hasChildren: item.has_children
                };
                nodes.push(node);
                processedIds.add(item.id);
            }
        }

        // Add workspace as root node
        nodes.push({
            id: 'workspace',
            title: 'Workspace Root',
            type: 'workspace',
            parent_id: null
        });

        // Process pages and databases
        workspaceData.results.forEach(addNode);
        workspaceData.databases.forEach(addNode);

        // Create links based on parent-child relationships
        nodes.forEach(node => {
            if (node.parent_id) {
                links.push({
                    source: node.parent_id,
                    target: node.id,
                    type: 'parent-child'
                });
            }
        });

        console.log('Processed graph:', { nodes: nodes.length, links: links.length });
        return { nodes, links };
    } catch (error) {
        console.error('Error parsing workspace data:', error);
        throw error;
    }
}