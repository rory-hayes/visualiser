import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/gennotion', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'gennotion.html'));
});

// Serve visualization files with proper headers
router.use('/visualizations', (req, res, next) => {
    // Set proper CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set cache control headers
    res.header('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    next();
}, express.static(path.join(__dirname, '../public/visualizations'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

export default router; 