import {
  SUBSCRIPTION_LIMITS,
  toAgeBucket,
  type AnonymousMarker,
  type GeoBounds,
  type MapFilters,
} from '@realmeety/shared'
import { config } from '../../config.js'
import { query } from '../../db/pool.js'
import { redis, redisAvailable, PRESENCE_CHANNEL, PRESENCE_GEO_KEY } from '../../redis/client.js'
import { generateSessionToken } from '../auth/service.js'
import { obfuscateCoordinates } from '../../utils/geo.js'

interface PresenceEntry {
  userId: string
  sessionToken: string
  lat: number
  lng: number
  age: number
  orientation: string
  updatedAt: number
}

export async function updatePresence(
  userId: string,
  lat: number,
  lng: number,
  subscriptionTier: string,
): Promise<AnonymousMarker> {
  const obfuscated = obfuscateCoordinates(lat, lng)

  const userResult = await query<{ age: number; orientation: string; session_token: string | null }>(
    `SELECT age, orientation, session_token FROM users WHERE id = $1`,
    [userId],
  )
  const user = userResult.rows[0]
  if (!user?.age || !user.orientation) {
    throw new Error('Profil incomplet')
  }

  const sessionToken = user.session_token ?? generateSessionToken()

  await query(
    `UPDATE users SET
      location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
      location_updated_at = NOW(),
      session_token = $4,
      updated_at = NOW()
     WHERE id = $1`,
    [userId, obfuscated.lng, obfuscated.lat, sessionToken],
  )

  const entry: PresenceEntry = {
    userId,
    sessionToken,
    lat: obfuscated.lat,
    lng: obfuscated.lng,
    age: user.age,
    orientation: user.orientation,
    updatedAt: Date.now(),
  }

  if (redisAvailable) {
    await redis
      .multi()
      .geoadd(PRESENCE_GEO_KEY, obfuscated.lng, obfuscated.lat, sessionToken)
      .setex(`presence:${sessionToken}`, config.locationTtlSeconds, JSON.stringify(entry))
      .publish(PRESENCE_CHANNEL, JSON.stringify({ type: 'update', marker: toMarker(entry) }))
      .exec()
  }

  return toMarker(entry)
}

export async function removePresence(userId: string): Promise<void> {
  const result = await query<{ session_token: string | null }>(
    `SELECT session_token FROM users WHERE id = $1`,
    [userId],
  )
  const token = result.rows[0]?.session_token
  if (token && redisAvailable) {
    await redis
      .multi()
      .zrem(PRESENCE_GEO_KEY, token)
      .del(`presence:${token}`)
      .publish(PRESENCE_CHANNEL, JSON.stringify({ type: 'remove', sessionToken: token }))
      .exec()
  }
}

function toMarker(entry: PresenceEntry): AnonymousMarker {
  return {
    sessionToken: entry.sessionToken,
    lat: entry.lat,
    lng: entry.lng,
    ageBucket: toAgeBucket(entry.age),
    orientationBucket: entry.orientation,
  }
}

export async function queryNearbyMarkers(
  viewerId: string,
  lat: number,
  lng: number,
  bounds: GeoBounds,
  filters: MapFilters,
): Promise<AnonymousMarker[]> {
  const viewerResult = await query<{ subscription_tier: string; orientation: string | null }>(
    `SELECT subscription_tier, orientation FROM users WHERE id = $1`,
    [viewerId],
  )
  const viewer = viewerResult.rows[0]
  const tier = (viewer?.subscription_tier ?? 'free') as keyof typeof SUBSCRIPTION_LIMITS
  const radius = SUBSCRIPTION_LIMITS[tier].radiusMeters

  const result = await query<{
    session_token: string
    lat: number
    lng: number
    age: number
    orientation: string
    distance: number
  }>(
    `SELECT
      u.session_token,
      ST_Y(u.location::geometry) AS lat,
      ST_X(u.location::geometry) AS lng,
      u.age,
      u.orientation,
      ST_Distance(u.location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography) AS distance
     FROM users u
     WHERE u.deleted_at IS NULL
       AND u.availability_status = 'available'
       AND u.id != $1
       AND u.age BETWEEN $4 AND $5
       AND u.orientation = ANY($6::text[])
       AND u.location IS NOT NULL
       AND u.location_updated_at > NOW() - INTERVAL '${config.locationTtlSeconds} seconds'
       AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $7)
       AND ST_Y(u.location::geometry) BETWEEN $8 AND $9
       AND ST_X(u.location::geometry) BETWEEN $10 AND $11
     ORDER BY distance ASC
     LIMIT 200`,
    [
      viewerId,
      lng,
      lat,
      filters.ageMin,
      filters.ageMax,
      filters.orientations.length ? filters.orientations : ['hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say'],
      radius,
      bounds.south,
      bounds.north,
      bounds.west,
      bounds.east,
    ],
  )

  return result.rows.map(row => ({
    sessionToken: row.session_token,
    lat: row.lat,
    lng: row.lng,
    ageBucket: toAgeBucket(row.age),
    orientationBucket: row.orientation,
    distanceMeters: Math.round(row.distance),
  }))
}

export async function cleanupStalePresence(): Promise<number> {
  const result = await query<{ id: string; session_token: string | null }>(
    `UPDATE users SET location = NULL, session_token = NULL, availability_status = 'offline'
     WHERE availability_status = 'available'
       AND (location_updated_at IS NULL OR location_updated_at < NOW() - INTERVAL '${config.locationTtlSeconds} seconds')
     RETURNING id, session_token`,
  )
  for (const row of result.rows) {
    if (row.session_token && redisAvailable) {
      await redis.zrem(PRESENCE_GEO_KEY, row.session_token)
      await redis.del(`presence:${row.session_token}`)
    }
  }
  return result.rowCount ?? 0
}
