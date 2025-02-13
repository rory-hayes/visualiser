import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import staticRoutes from './routes/static.js';
import authRoutes from './routes/auth.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create visualizations directory if it doesn't exist
const visualizationsDir = path.join(__dirname, 'public', 'visualizations');
if (!fs.existsSync(visualizationsDir)) {
    fs.mkdirSync(visualizationsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.use('/api', apiRoutes);
app.use('/', staticRoutes);
app.use('/', authRoutes);

// Start the Server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));