import { Redis as RedisClient } from 'ioredis';
import { getEnv } from '../config/env.js';

let redis: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (!redis) {
    redis = new RedisClient(getEnv().REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (client.status === 'ready') return;
  await client.connect();
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await getRedis().get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(key, value, 'EX', ttlSeconds);
  } catch {
    // Cache optional — fail silently
  }
}

export async function revokeToken(jti: string, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(`revoked:${jti}`, '1', 'EX', ttlSeconds);
  } catch {
    // Fail open for MVP if Redis down
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const val = await getRedis().get(`revoked:${jti}`);
    return val === '1';
  } catch {
    return false;
  }
}
