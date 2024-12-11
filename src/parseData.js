export function parseDataToGraph(workspaceData) {
    try {
        // Log the structure of incoming data
        console.log('Parsing workspace data structure:', {
            hasResults: !!workspaceData.results,
            resultsLength: workspaceData.results?.length,
            objectType: workspaceData.object,
            // Log a sample result if available
            sampleResult: workspaceData.results?.[0] ? {
                id: workspaceData.results[0].id,
                object: workspaceData.results[0].object,
                parentType: workspaceData.results[0].parent?.type,
                hasProperties: !!workspaceData.results[0].properties
            } : null
        });

        if (!workspaceData.results || !Array.isArray(workspaceData.results)) {
            throw new Error('Invalid workspace data structure');
        }

        const nodes = [];
        const links = [];
        const pageMap = new Map();
        const processedIds = new Set();

        // Process each page from the results array
        workspaceData.results.forEach(page => {
            if (processedIds.has(page.id)) {
                return; // Skip if already processed
            }

            // Extract title from various possible locations
            let title;
            if (page.properties?.title?.title?.[0]?.plain_text) {
                title = page.properties.title.title[0].plain_text;
            } else if (page.properties?.Name?.title?.[0]?.plain_text) {
                title = page.properties.Name.title[0].plain_text;
            } else if (page.properties?.name?.title?.[0]?.plain_text) {
                title = page.properties.name.title[0].plain_text;
            } else {
                title = `Untitled ${page.object}`;
            }

            // Add node for the current page
            nodes.push({
                id: page.id,
                name: title,
                type: page.object,
                url: page.url
            });

            processedIds.add(page.id);
            pageMap.set(page.id, nodes.length - 1);

            // Handle parent relationships
            if (page.parent) {
                let parentId;
                switch (page.parent.type) {
                    case 'page_id':
                        parentId = page.parent.page_id;
                        break;
                    case 'database_id':
                        parentId = page.parent.database_id;
                        break;
                    case 'workspace':
                        // Root level page, no parent link needed
                        break;
                    default:
                        console.log(`Unknown parent type: ${page.parent.type} for page ${page.id}`);
                }

                if (parentId) {
                    // Add parent node if it doesn't exist
                    if (!processedIds.has(parentId)) {
                        nodes.push({
                            id: parentId,
                            name: `Parent ${page.parent.type}`,
                            type: page.parent.type === 'database_id' ? 'database' : 'page',
                            url: null
                        });
                        processedIds.add(parentId);
                        pageMap.set(parentId, nodes.length - 1);
                    }

                    links.push({
                        source: parentId,
                        target: page.id
                    });
                }
            }
        });

        console.log('Graph parsing complete:', {
            nodesCount: nodes.length,
            linksCount: links.length,
            uniqueIds: processedIds.size,
            sampleNode: nodes[0],
            sampleLink: links[0]
        });

        return {
            nodes,
            links
        };
    } catch (error) {
        console.error('Error parsing workspace data:', {
            error: error.message,
            stack: error.stack,
            workspaceDataType: typeof workspaceData,
            hasResults: !!workspaceData?.results
        });
        throw new Error(`Failed to parse workspace data: ${error.message}`);
    }
}