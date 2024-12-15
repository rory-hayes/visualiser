import axios from 'axios';

const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';

export async function fetchWorkspaceData(code) {
    try {
        // Verify required environment variables
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Missing required Notion credentials');
        }

        console.log('OAuth exchange parameters:', {
            redirectUri: REDIRECT_URI,
            hasClientId: !!CLIENT_ID,
            hasClientSecret: !!CLIENT_SECRET,
            code: code?.substring(0, 8) + '...'
        });

        console.log('Attempting token exchange with code:', code);
        
        // First, exchange the authorization code for an access token
        const tokenResponse = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }, {
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Token exchange response status:', tokenResponse.status);
        console.log('Token response data:', {
            bot_id: tokenResponse.data.bot_id,
            workspace_name: tokenResponse.data.workspace_name,
            workspace_icon: tokenResponse.data.workspace_icon,
            workspace_id: tokenResponse.data.workspace_id
        });

        if (!tokenResponse.data.access_token) {
            throw new Error('Failed to obtain access token');
        }

        const accessToken = tokenResponse.data.access_token;
        const workspaceId = tokenResponse.data.workspace_id;
        const workspaceName = tokenResponse.data.workspace_name;

        console.log('Successfully obtained access token');

        // First, get all pages and databases
        const searchResponse = await axios.post('https://api.notion.com/v1/search', {
            filter: {
                value: "page",
                property: "object"
            },
            page_size: 100,
            sort: {
                direction: "ascending",
                timestamp: "last_edited_time"
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        // Then get databases separately
        const databaseResponse = await axios.post('https://api.notion.com/v1/search', {
            filter: {
                value: "database",
                property: "object"
            },
            page_size: 100
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        // Combine all results
        const allResults = [
            // Add workspace as root node
            {
                id: workspaceId,
                type: 'workspace',
                name: workspaceName,
                icon: tokenResponse.data.workspace_icon,
                parent: null
            },
            // Add pages and databases
            ...searchResponse.data.results,
            ...databaseResponse.data.results
        ];

        console.log('Data fetched successfully:', {
            pagesCount: searchResponse.data.results.length,
            databasesCount: databaseResponse.data.results.length,
            totalCount: allResults.length
        });

        return {
            workspace: {
                id: workspaceId,
                name: workspaceName,
                icon: tokenResponse.data.workspace_icon
            },
            results: allResults.map(item => ({
                ...item,
                workspace_id: workspaceId,
                last_edited_time: item.last_edited_time,
                created_time: item.created_time,
                // Get proper title based on object type
                title: item.type === 'workspace' ? item.name :
                    item.object === 'database' ? 
                        item.title?.[0]?.plain_text :
                        item.properties?.title?.title?.[0]?.plain_text || 
                        item.properties?.Name?.title?.[0]?.plain_text ||
                        `Untitled ${item.object}`
            })),
            has_more: searchResponse.data.has_more || databaseResponse.data.has_more
        };

    } catch (error) {
        console.error('Fetch workspace data error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });

        throw new Error(
            error.response?.data?.message || 
            error.message || 
            'An unexpected error occurred during authentication'
        );
    }
}