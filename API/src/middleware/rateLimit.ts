import type { Context, Next } from 'hono';
import { getRedis } from '../db/redis.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

export function rateLimitMiddleware(maxRequests = MAX_REQUESTS) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      ?? c.req.header('x-real-ip')
      ?? 'unknown';
    const key = `ratelimit:${ip}:${Math.floor(Date.now() / (WINDOW_SECONDS * 1000))}`;

    try {
      const redis = getRedis();
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }
      if (count > maxRequests) {
        return c.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, 429);
      }
    } catch {
      // Redis unavailable — allow request
    }

    await next();
  };
}

export function locationRateLimit() {
  const cooldownSeconds = process.env.NODE_ENV === 'development' ? 3 : 10;

  return async (c: Context, next: Next): Promise<Response | void> => {
    const userId = c.get('user')?._id?.toHexString?.() ?? c.req.header('x-forwarded-for') ?? 'anon';
    const key = `ratelimit:location:${userId}`;

    try {
      const redis = getRedis();
      const exists = await redis.get(key);
      if (exists) {
        return c.json({
          error: `Mise à jour trop fréquente. Attendez ${cooldownSeconds} secondes.`,
        }, 429);
      }
    } catch {
      // Fail open
    }

    await next();

    if (c.res.status >= 200 && c.res.status < 300) {
      try {
        const redis = getRedis();
        await redis.set(key, '1', 'EX', cooldownSeconds);
      } catch {
        // Fail open
      }
    }
  };
}
