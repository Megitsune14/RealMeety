import { Redis } from 'ioredis'
import { config } from '../config.js'

export let redisAvailable = false

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: () => null,
  enableOfflineQueue: false,
})

redis.on('error', () => {
  // Erreurs attendues si Redis n'est pas démarré — évite le spam console
})

export async function connectRedis(): Promise<boolean> {
  if (redis.status === 'ready') {
    redisAvailable = true
    return true
  }
  try {
    await redis.connect()
    redisAvailable = true
    return true
  } catch {
    redisAvailable = false
    return false
  }
}

export const PRESENCE_CHANNEL = 'presence:updates'
export const PRESENCE_GEO_KEY = 'presence:geo'
