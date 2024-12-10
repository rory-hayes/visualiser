import { Redis } from '@upstash/redis';
import { logger } from '@/utils/logger';

const redis = new Redis({
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
});

interface RateLimitResult {
    success: boolean;
    remaining?: number;
    retryAfter?: number;
}

export async function rateLimit(
    req: Request,
    limit = 100,
    window = 60
): Promise<RateLimitResult> {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        const key = `rate-limit:${ip}`;
        
        const requests = await redis.incr(key);
        
        if (requests === 1) {
            await redis.expire(key, window);
        }

        const ttl = await redis.ttl(key);
        const remaining = Math.max(0, limit - requests);

        if (requests > limit) {
            return {
                success: false,
                remaining: 0,
                retryAfter: ttl,
            };
        }

        return {
            success: true,
            remaining,
        };
    } catch (error) {
        logger.error('Rate limit error:', error);
        // Fail open if Redis is down
        return { success: true };
    }
} 