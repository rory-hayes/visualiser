import { logger } from '@/utils/logger';

// Simple in-memory store
const store = new Map<string, { count: number; timestamp: number }>();

export async function rateLimit(ip: string) {
    try {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const max = 100; // max requests per windowMs

        const record = store.get(ip) || { count: 0, timestamp: now };
        
        if (now - record.timestamp > windowMs) {
            record.count = 0;
            record.timestamp = now;
        }
        
        record.count++;
        store.set(ip, record);

        return { 
            success: record.count <= max,
            limit: max,
            remaining: Math.max(0, max - record.count),
            reset: record.timestamp + windowMs,
        };
    } catch (error) {
        logger.error('Rate limit error:', error);
        // Fail open if there's an error
        return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
    }
} 