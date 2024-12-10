import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupMonitoring } from '@/utils/monitoring';
import { logger } from '@/utils/logger';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from '@/utils/rateLimit';
import { setupHealthCheck } from '@/utils/healthCheck';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize services
const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
});

setupMonitoring();

async function startServer() {
    try {
        const app = next({ dev, hostname, port });
        const handle = app.getRequestHandler();

        await app.prepare();
        await prisma.$connect();

        logger.info('Database connection established');

        const server = createServer(async (req, res) => {
            try {
                // Health check endpoint
                if (req.url === '/health') {
                    return setupHealthCheck(req, res, prisma);
                }

                // Apply rate limiting
                const rateLimitResult = await rateLimit(req);
                if (!rateLimitResult.success) {
                    res.statusCode = 429;
                    res.setHeader('Retry-After', rateLimitResult.retryAfter);
                    res.end('Too Many Requests');
                    return;
                }

                // Add security headers
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('X-XSS-Protection', '1; mode=block');
                res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

                if (process.env.NODE_ENV === 'production') {
                    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
                }

                const parsedUrl = parse(req.url!, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                logger.error('Error handling request:', err);
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        });

        // Graceful shutdown handler
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}, starting graceful shutdown`);

            server.close(async () => {
                try {
                    await prisma.$disconnect();
                    logger.info('Database connection closed');
                    process.exit(0);
                } catch (err) {
                    logger.error('Error during shutdown:', err);
                    process.exit(1);
                }
            });

            // Force shutdown after timeout
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        server.listen(port, () => {
            logger.info(`> Ready on http://${hostname}:${port}`);
        });
    } catch (err) {
        logger.error('Error starting server:', err);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer(); 