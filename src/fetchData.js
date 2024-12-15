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

        // First, get all workspaces/teamspaces
        const workspaceData = await axios.post('https://api.notion.com/v1/search', {
            filter: {
                property: 'object',
                value: 'workspace'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        // Then get all pages and databases with their metadata
        const pagesData = await axios.post('https://api.notion.com/v1/search', {
            sort: {
                direction: 'descending',
                timestamp: 'last_edited_time'
            },
            page_size: 100 // Increase if needed
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        // Get database details
        const databasePromises = pagesData.data.results
            .filter(item => item.object === 'database')
            .map(db => axios.get(`https://api.notion.com/v1/databases/${db.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': '2022-06-28'
                }
            }));

        const databaseDetails = await Promise.all(databasePromises);

        // Combine all data
        return {
            workspace: {
                id: workspaceId,
                name: workspaceName,
                icon: tokenResponse.data.workspace_icon
            },
            results: pagesData.data.results.map(item => ({
                ...item,
                workspace_id: workspaceId,
                last_edited_time: item.last_edited_time,
                created_time: item.created_time,
                // Get proper title based on object type
                title: item.object === 'database' 
                    ? item.title?.[0]?.plain_text 
                    : item.properties?.title?.title?.[0]?.plain_text || 
                      item.properties?.Name?.title?.[0]?.plain_text ||
                      `Untitled ${item.object}`
            })),
            databases: databaseDetails.map(db => db.data)
        };

    } catch (error) {
        console.error('Fetch workspace data error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });

        if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please verify your Notion integration settings.');
        }

        throw new Error(
            error.response?.data?.message || 
            error.message || 
            'An unexpected error occurred during authentication'
        );
    }
}