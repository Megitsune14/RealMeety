import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { queryNearbyMarkers } from './service.js'

const nearbySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
  filters: z.object({
    ageMin: z.number().min(18).default(18),
    ageMax: z.number().max(99).default(99),
    orientations: z
      .array(z.enum(['hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say']))
      .default([]),
  }),
})

export async function presenceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/presence/nearby', { preHandler: [app.authenticate] }, async (request) => {
    const body = nearbySchema.parse(request.body)
    const markers = await queryNearbyMarkers(
      request.user.sub,
      body.lat,
      body.lng,
      body.bounds,
      body.filters,
    )
    return { markers }
  })
}
