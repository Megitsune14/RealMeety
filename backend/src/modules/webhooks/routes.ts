import type { FastifyInstance } from 'fastify'
import { handleStripeWebhook } from '../kyc/stripe-identity.js'
import { setKycStatus } from '../auth/service.js'
import { config } from '../../config.js'

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhooks/stripe', async (request, reply) => {
    const signature = request.headers['stripe-signature']
    if (typeof signature !== 'string') {
      return reply.code(400).send({ error: 'Missing signature' })
    }

    const rawBody = typeof request.body === 'string'
      ? Buffer.from(request.body)
      : Buffer.from(JSON.stringify(request.body ?? {}))

    const result = await handleStripeWebhook(rawBody, signature)
    if (result?.userId && result.kycStatus) {
      await setKycStatus(result.userId, result.kycStatus)
    }
    return { received: true }
  })

  app.post('/webhooks/kyc/mock-complete', async (request, reply) => {
    if (config.nodeEnv === 'production') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
    const { userId } = request.body as { userId?: string }
    if (!userId) return reply.code(400).send({ error: 'userId required' })
    await setKycStatus(userId, 'verified')
    return { kycStatus: 'verified' }
  })
}
