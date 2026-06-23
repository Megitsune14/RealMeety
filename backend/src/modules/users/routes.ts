import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  SUBSCRIPTION_LIMITS,
  type AvailabilityStatus,
  type Orientation,
} from '@realmeety/shared'
import { query } from '../../db/pool.js'
import { toUserMinimal, USER_SELECT } from '../../utils/user-mapper.js'
import { removePresence, updatePresence } from '../presence/service.js'

const patchMeSchema = z.object({
  orientation: z
    .enum(['hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say'])
    .optional(),
  availabilityStatus: z.enum(['offline', 'available', 'paused']).optional(),
})

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const user = await findFullUser(request.user.sub)
    if (!user) return { error: 'Not found' }
    return user
  })

  app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = patchMeSchema.parse(request.body)
    const userId = request.user.sub

    if (body.availabilityStatus === 'available') {
      const limits = await getAvailabilityLimits(userId)
      if (!limits.canGoAvailable) {
        return reply.code(403).send({
          error: 'Limite quotidienne de disponibilité atteinte (plan gratuit)',
          limits,
        })
      }
    }

    if (body.orientation !== undefined) {
      await query(`UPDATE users SET orientation = $2, updated_at = NOW() WHERE id = $1`, [
        userId,
        body.orientation,
      ])
    }

    if (body.availabilityStatus !== undefined) {
      await query(
        `UPDATE users SET availability_status = $2, updated_at = NOW() WHERE id = $1`,
        [userId, body.availabilityStatus],
      )
      if (body.availabilityStatus !== 'available') {
        await query(
          `UPDATE users SET location = NULL, session_token = NULL WHERE id = $1`,
          [userId],
        )
        await removePresence(userId)
      }
    }

    return findFullUser(userId)
  })

  app.put('/me/location', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = locationSchema.parse(request.body)
    const userId = request.user.sub

    const statusResult = await query<{ availability_status: string; subscription_tier: string }>(
      `SELECT availability_status, subscription_tier FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    )
    const row = statusResult.rows[0]
    if (!row || row.availability_status !== 'available') {
      return reply.code(403).send({ error: 'Localisation autorisée uniquement en mode disponible' })
    }

    const marker = await updatePresence(userId, body.lat, body.lng, row.subscription_tier)
    return { ok: true, sessionToken: marker.sessionToken }
  })

  app.get('/me/limits', { preHandler: [app.authenticate] }, async (request) => {
    return getAvailabilityLimits(request.user.sub)
  })
}

async function findFullUser(userId: string) {
  const result = await query(
    `SELECT ${USER_SELECT} FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  )
  const row = result.rows[0]
  if (!row) return null
  const user = toUserMinimal(row as Parameters<typeof toUserMinimal>[0])
  const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier]
  return { ...user, limits }
}

async function getAvailabilityLimits(userId: string) {
  const result = await query<{
    subscription_tier: string
    daily_availability_seconds: number
    daily_availability_date: string | null
  }>(
    `SELECT subscription_tier, daily_availability_seconds, daily_availability_date
     FROM users WHERE id = $1`,
    [userId],
  )
  const row = result.rows[0]
  const tier = (row?.subscription_tier ?? 'free') as keyof typeof SUBSCRIPTION_LIMITS
  const limits = SUBSCRIPTION_LIMITS[tier]
  const today = new Date().toISOString().slice(0, 10)
  const usedSeconds =
    row?.daily_availability_date === today ? row.daily_availability_seconds : 0
  const maxSeconds = limits.maxDailyAvailabilityMinutes
    ? limits.maxDailyAvailabilityMinutes * 60
    : null
  const canGoAvailable = maxSeconds === null || usedSeconds < maxSeconds
  return {
    tier,
    radiusMeters: limits.radiusMeters,
    maxDailyAvailabilityMinutes: limits.maxDailyAvailabilityMinutes,
    usedAvailabilityMinutes: Math.floor(usedSeconds / 60),
    canGoAvailable,
  }
}

export type { Orientation, AvailabilityStatus }
