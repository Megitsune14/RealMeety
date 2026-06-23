import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import { config } from './config.js'
import { connectRedis, redis, PRESENCE_CHANNEL } from './redis/client.js'
import { migrate } from './db/migrate.js'
import { authRoutes } from './modules/auth/routes.js'
import { usersRoutes } from './modules/users/routes.js'
import { presenceRoutes } from './modules/presence/routes.js'
import { billingRoutes } from './modules/billing/routes.js'
import { webhookRoutes } from './modules/webhooks/routes.js'
import { wsRoutes, broadcastPresenceUpdate } from './ws/presence-ws.js'
import { cleanupStalePresence } from './modules/presence/service.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

import type { FastifyReply, FastifyRequest } from 'fastify'

const app = Fastify({
  logger: config.nodeEnv !== 'test',
})

await app.register(cors, { origin: true })
await app.register(jwt, { secret: config.jwtSecret })
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})
await app.register(websocket)

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Non autorisé' })
  }
})

app.get('/health', async () => ({ status: 'ok', service: 'realmeety-api' }))

await app.register(authRoutes)
await app.register(usersRoutes)
await app.register(presenceRoutes)
await app.register(billingRoutes)
await app.register(webhookRoutes)
await app.register(wsRoutes)

async function start(): Promise<void> {
  try {
    await migrate()
  } catch (err) {
    app.log.warn({ err }, 'Migration skipped — database may be unavailable in dev')
  }

  try {
    const connected = await connectRedis()
    if (connected) {
      const sub = redis.duplicate()
      sub.on('error', () => {})
      await sub.subscribe(PRESENCE_CHANNEL)
      sub.on('message', () => {
        broadcastPresenceUpdate()
      })
    }
  } catch (err) {
    app.log.warn({ err }, 'Redis unavailable — presence realtime disabled')
  }

  setInterval(() => {
    cleanupStalePresence().catch(() => {})
  }, 30_000)

  await app.listen({ port: config.port, host: config.host })
  app.log.info(`RealMeety API listening on ${config.host}:${config.port}`)
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
