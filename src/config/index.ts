const config = {
    app: {
        name: 'Notion Graph',
        version: process.env.NEXT_PUBLIC_VERSION || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
    auth: {
        providers: {
            google: {
                enabled: !!process.env.GOOGLE_CLIENT_ID,
            },
            notion: {
                enabled: !!process.env.NOTION_CLIENT_ID,
            },
        },
        session: {
            maxAge: 30 * 24 * 60 * 60, // 30 days
        },
    },
    database: {
        url: process.env.DATABASE_URL!,
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
        timeout: parseInt(process.env.DATABASE_TIMEOUT || '5000', 10),
    },
    redis: {
        url: process.env.REDIS_URL,
        enabled: !!process.env.REDIS_URL,
    },
    monitoring: {
        sentry: {
            enabled: !!process.env.SENTRY_DSN,
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV,
        },
        analytics: {
            enabled: !!process.env.NEXT_PUBLIC_ANALYTICS_ID,
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info',
        },
    },
    features: {
        workspaceSync: {
            enabled: true,
            interval: parseInt(process.env.SYNC_INTERVAL || '3600000', 10), // 1 hour
        },
        export: {
            enabled: true,
            formats: ['json', 'csv'] as const,
        },
    },
} as const;

export type Config = typeof config;
export default config; 