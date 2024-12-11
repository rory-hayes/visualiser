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
        console.log('Successfully obtained access token');

        // Now use the access token to fetch workspace data
        const workspaceData = await axios.post('https://api.notion.com/v1/search', {
            filter: {
                property: 'object',
                value: 'page'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        console.log('Workspace API Response:', {
            status: workspaceData.status,
            hasResults: !!workspaceData.data.results,
            resultCount: workspaceData.data.results?.length,
            // Log the first result as an example (with sensitive data redacted)
            sampleResult: workspaceData.data.results?.[0] ? {
                id: workspaceData.data.results[0].id,
                created_time: workspaceData.data.results[0].created_time,
                last_edited_time: workspaceData.data.results[0].last_edited_time,
                object: workspaceData.data.results[0].object,
                parent: workspaceData.data.results[0].parent,
                properties: Object.keys(workspaceData.data.results[0].properties || {}),
                url: workspaceData.data.results[0].url
            } : null,
            // Log all results structure (without sensitive content)
            resultsSummary: workspaceData.data.results?.map(result => ({
                id: result.id,
                type: result.object,
                parentType: result.parent?.type,
                hasProperties: !!result.properties,
                propertyKeys: Object.keys(result.properties || {}),
                url: result.url
            }))
        });

        // Log pagination info if available
        if (workspaceData.data.has_more) {
            console.log('Pagination info:', {
                has_more: workspaceData.data.has_more,
                next_cursor: workspaceData.data.next_cursor
            });
        }

        console.log('Successfully fetched workspace data');
        return workspaceData.data;
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