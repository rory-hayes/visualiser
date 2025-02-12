import express from 'express';
import axios from 'axios';

const router = express.Router();

// OAuth Configuration
const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/callback';
const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

// Redirect to Notion OAuth URL
router.get('/auth', (req, res) => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Handle OAuth Callback
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.post(
            TOKEN_URL,
            {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                },
            }
        );

        // Store token in session
        req.session.notionToken = tokenResponse.data.access_token;
        
        // Redirect to main application
        res.redirect('/gennotion');
    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).send('Failed to authenticate with Notion');
    }
});

export default router; 