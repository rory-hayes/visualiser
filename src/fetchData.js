import axios from 'axios';

const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';

// Helper function to fetch all pages and databases
async function fetchAllPages(notion) {
    const results = [];
    let hasMore = true;
    let startCursor = undefined;

    // First, fetch all pages
    while (hasMore) {
        const response = await notion.search({
            page_size: 100,
            start_cursor: startCursor,
            filter: {
                property: 'object',
                value: 'page'
            }
        });

        results.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    // Reset cursor for database fetch
    hasMore = true;
    startCursor = undefined;

    // Then fetch all databases
    while (hasMore) {
        const response = await notion.search({
            page_size: 100,
            start_cursor: startCursor,
            filter: {
                property: 'object',
                value: 'database'
            }
        });

        console.log('Database fetch response:', {
            count: response.results.length,
            sample: response.results[0]?.object
        });

        results.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    // Log the distribution of object types
    const objectTypes = results.reduce((acc, item) => {
        acc[item.object] = (acc[item.object] || 0) + 1;
        return acc;
    }, {});

    console.log('Fetched items distribution:', objectTypes);

    return results;
}

// Helper function to handle missing parents
async function fetchMissingParents(notion, missingParentIds) {
    const parents = new Map();
    
    for (const parentId of missingParentIds) {
        try {
            const response = await notion.pages.retrieve({ page_id: parentId });
            parents.set(parentId, {
                id: response.id,
                name: response.properties?.title?.title[0]?.text?.content || 'Untitled',
                type: response.parent.type === 'database_id' ? 'database' : 'page',
                lastEdited: response.last_edited_time,
                url: response.url
            });
        } catch (error) {
            console.warn(`Could not fetch parent ${parentId}:`, error.message);
        }
    }
    
    return parents;
}

// Main data fetching function
export async function fetchWorkspaceData(notion) {
    console.log('Starting to fetch workspace data...');
    try {
        if (!notion) {
            throw new Error('Notion client is required');
        }

        // Initial data fetch
        const pages = await fetchAllPages(notion);
        console.log('Fetched pages:', pages.length);

        // Track missing parents
        const missingParentIds = new Set();
        pages.forEach(page => {
            const parentId = page.parent?.page_id || page.parent?.database_id;
            if (parentId && !pages.some(p => p.id === parentId)) {
                missingParentIds.add(parentId);
            }
        });

        // Fetch missing parents
        let additionalNodes = [];
        if (missingParentIds.size > 0) {
            console.log(`Fetching ${missingParentIds.size} missing parent nodes...`);
            const parents = await fetchMissingParents(notion, missingParentIds);
            additionalNodes = Array.from(parents.values());
        }

        // Combine all nodes
        const allNodes = [...pages, ...additionalNodes];

        // Create graph structure with improved type detection
        const graph = {
            nodes: allNodes.map(page => {
                // Improved title extraction
                let title = 'Untitled';
                try {
                    if (page.object === 'database') {
                        // Handle database title
                        title = page.title[0]?.plain_text || page.title || 'Untitled Database';
                    } else if (page.properties?.title?.title) {
                        title = page.properties.title.title[0]?.text?.content || 'Untitled';
                    } else if (page.properties?.Name?.title) {
                        title = page.properties.Name.title[0]?.text?.content || 'Untitled';
                    } else if (page.title) {
                        title = Array.isArray(page.title) 
                            ? page.title[0]?.text?.content 
                            : page.title;
                    }
                } catch (error) {
                    console.warn('Error extracting title for item:', page.id, error);
                }

                // Improved type detection
                let type = 'page';
                try {
                    if (page.object === 'database') {
                        type = 'database';
                    } else if (page.parent?.type === 'workspace') {
                        type = 'workspace';
                    } else if (page.parent?.database_id) {
                        type = 'page'; // This is a database item
                    } else if (page.parent?.page_id) {
                        type = page.has_children ? 'page' : 'child_page';
                    }

                    // Debug logging for type detection
                    console.log('Node type detection:', {
                        id: page.id,
                        object: page.object,
                        title,
                        detectedType: type,
                        parentType: page.parent?.type,
                        hasParentDb: !!page.parent?.database_id,
                        hasParentPage: !!page.parent?.page_id
                    });

                } catch (error) {
                    console.warn('Error detecting type for item:', page.id, error);
                }

                return {
                    id: page.id,
                    name: title,
                    type: type,
                    lastEdited: page.last_edited_time,
                    url: page.url,
                    parentId: page.parent?.page_id || page.parent?.database_id,
                    object: page.object // Adding this for debugging
                };
            }),
            links: []
        };

        // Create links only when both nodes exist
        allNodes.forEach(page => {
            const parentId = page.parent?.page_id || page.parent?.database_id;
            if (parentId && graph.nodes.some(n => n.id === parentId)) {
                graph.links.push({
                    source: parentId,
                    target: page.id
                });
            }
        });

        // Log node type distribution
        const typeDistribution = graph.nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {});

        console.log('Graph structure created:', {
            nodes: graph.nodes.length,
            links: graph.links.length,
            typeDistribution,
            untitledNodes: graph.nodes.filter(n => n.name === 'Untitled').length
        });

        return graph;

    } catch (error) {
        console.error('Error in fetchWorkspaceData:', error);
        throw error;
    }
}

// Helper function to determine node type
function determineNodeType(page) {
    if (page.parent.type === 'workspace') return 'workspace';
    if (page.parent.type === 'database_id') return 'database';
    if (page.parent.type === 'page_id') {
        return page.has_children ? 'page' : 'child_page';
    }
    return 'page';
}

// Export other necessary functions if needed
export async function exchangeCodeForToken(code) {
    try {
        const response = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }, {
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Token exchange error:', error);
        throw error;
    }
}