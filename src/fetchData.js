import axios from 'axios';

const CLIENT_ID = '150d872b-594c-804e-92e4-0037ffa80cff';
const CLIENT_SECRET = 'secret_X3vWYmVdViJMEDdQsIK52M8NZUuASDYyNAbAb27veeG'; // Temporarily hardcoded
const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';

export async function fetchWorkspaceData(code) {
    try {
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

        if (!tokenResponse.data.access_token) {
            throw new Error('Failed to obtain access token');
        }

        const accessToken = tokenResponse.data.access_token;
        console.log('Successfully obtained access token');

        // Now use the access token to fetch workspace data
        const workspaceData = await axios.get('https://api.notion.com/v1/search', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28'
            }
        });

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