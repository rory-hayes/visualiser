import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
    },
    base: {
        env: process.env.NODE_ENV,
    },
});

export { logger };

// Create middleware for API route logging
export function withLogging(handler: Function) {
    return async (req: Request, ...args: any[]) => {
        const start = Date.now();
        const requestId = crypto.randomUUID();
        const method = req.method;
        const url = new URL(req.url);

        logger.info({
            requestId,
            method,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            msg: 'Incoming request',
        });

        try {
            const response = await handler(req, ...args);
            const duration = Date.now() - start;

            logger.info({
                requestId,
                method,
                path: url.pathname,
                status: response.status,
                duration,
                msg: 'Request completed',
            });

            return response;
        } catch (error) {
            const duration = Date.now() - start;

            logger.error({
                requestId,
                method,
                path: url.pathname,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration,
                msg: 'Request failed',
            });

            throw error;
        }
    };
} 