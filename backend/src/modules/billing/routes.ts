import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../db/pool.js'
import { config } from '../../config.js'

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/billing/plans', async () => ({
    plans: [
      {
        id: 'realmeety_premium_monthly',
        name: 'Premium Mensuel',
        price: '9,99 €/mois',
        features: ['Rayon 2 km', 'Disponibilité illimitée', 'Filtres avancés'],
      },
      {
        id: 'realmeety_premium_yearly',
        name: 'Premium Annuel',
        price: '79,99 €/an',
        features: ['Rayon 2 km', 'Disponibilité illimitée', 'Filtres avancés', '2 mois offerts'],
      },
    ],
    freeTier: {
      radiusMeters: 500,
      maxDailyAvailabilityMinutes: 30,
    },
  }))

  app.post('/billing/revenuecat/webhook', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (config.revenueCatWebhookSecret && authHeader !== `Bearer ${config.revenueCatWebhookSecret}`) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const body = z
      .object({
        event: z.object({
          type: z.string(),
          app_user_id: z.string(),
        }),
      })
      .parse(request.body)

    const premiumEvents = [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'UNCANCELLATION',
      'PRODUCT_CHANGE',
    ]
    const freeEvents = ['CANCELLATION', 'EXPIRATION']

    let tier: 'free' | 'premium' | null = null
    if (premiumEvents.includes(body.event.type)) tier = 'premium'
    if (freeEvents.includes(body.event.type)) tier = 'free'

    if (tier) {
      await query(
        `UPDATE users SET subscription_tier = $2, updated_at = NOW() WHERE id = $1`,
        [body.event.app_user_id, tier],
      )
    }

    return { received: true }
  })

  app.post('/billing/mock/upgrade', { preHandler: [app.authenticate] }, async (request) => {
    if (config.nodeEnv === 'production') {
      return { error: 'Non disponible en production' }
    }
    await query(
      `UPDATE users SET subscription_tier = 'premium', updated_at = NOW() WHERE id = $1`,
      [request.user.sub],
    )
    return { subscriptionTier: 'premium' }
  })
}
