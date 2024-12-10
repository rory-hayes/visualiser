import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
});

export const captureException = (error: Error, context?: any) => {
    Sentry.captureException(error, {
        extra: context,
    });
};

export const captureMessage = (message: string, context?: any) => {
    Sentry.captureMessage(message, {
        extra: context,
    });
}; 