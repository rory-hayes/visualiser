import axios from 'axios';

export async function fetchWorkspaceData(authCode) {
    const CLIENT_ID = '150d872b-594c-804e-92e4-0037ffa80cff';
    const CLIENT_SECRET = 'secret_swa9JCDo4wE0FqJMxRxj4xcPpf00EZniVtKG2LIwc3r';
    const REDIRECT_URI = 'https://visualiser-xhjh.onrender.com/callback';
    const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

    try {
        // Exchange authorization code for an access token
        const tokenResponse = await axios.post(
            TOKEN_URL,
            {
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: REDIRECT_URI,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
                        'base64'
                    )}`,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Fetch data from Notion
        const response = await axios.post(
            'https://api.notion.com/v1/search',
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Notion-Version': '2022-06-28',
                },
            }
        );

        return response.data.results;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}