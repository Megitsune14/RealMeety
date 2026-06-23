import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { computeAge, isAdult } from '@realmeety/shared'
import { config } from '../../config.js'
import { hashIp } from '../../utils/geo.js'
import {
  createUser,
  exportUserData,
  findUserByEmail,
  findUserById,
  generateRefreshToken,
  hashPassword,
  recordConsent,
  revokeRefreshToken,
  setKycStatus,
  setUserAge,
  softDeleteUser,
  storeRefreshToken,
  validateRefreshToken,
  verifyPassword,
} from './service.js'
import { createIdentitySession } from '../kyc/stripe-identity.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const ageSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const consentSchema = z.object({
  consents: z.array(
    z.object({
      type: z.enum(['terms', 'privacy', 'location', 'kyc', 'marketing']),
      version: z.string(),
    }),
  ),
})

function refreshExpiryDate(): Date {
  const days = parseInt(config.jwtRefreshExpires, 10) || 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function issueTokens(
  app: FastifyInstance,
  userId: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: config.jwtAccessExpires })
  const refreshToken = generateRefreshToken()
  await storeRefreshToken(userId, refreshToken, refreshExpiryDate())
  return { accessToken, refreshToken }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const existing = await findUserByEmail(body.email)
    if (existing) {
      return reply.code(409).send({ error: 'Email déjà utilisé' })
    }
    const passwordHash = await hashPassword(body.password)
    const user = await createUser(body.email, passwordHash)
    const tokens = await issueTokens(app, user.id)
    return reply.code(201).send({ userId: user.id, ...tokens })
  })

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const user = await findUserByEmail(body.email)
    if (!user || !(await verifyPassword(user.password_hash as string, body.password))) {
      return reply.code(401).send({ error: 'Identifiants invalides' })
    }
    const tokens = await issueTokens(app, user.id as string)
    return { userId: user.id, ...tokens }
  })

  app.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(request.body)
    const userId = await validateRefreshToken(refreshToken)
    if (!userId) return reply.code(401).send({ error: 'Refresh token invalide' })
    await revokeRefreshToken(refreshToken)
    const tokens = await issueTokens(app, userId)
    return tokens
  })

  app.post('/auth/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(request.body ?? {})
    if (refreshToken) await revokeRefreshToken(refreshToken)
    return reply.code(204).send()
  })

  app.post('/auth/verify-age', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = ageSchema.parse(request.body)
    if (!isAdult(body.dateOfBirth)) {
      return reply.code(403).send({ error: 'Vous devez avoir 18 ans ou plus' })
    }
    const age = computeAge(body.dateOfBirth)
    await setUserAge(request.user.sub, age)
    return { age, verified: true }
  })

  app.post('/auth/kyc/start', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await findUserById(request.user.sub)
    if (!user?.age) {
      return reply.code(400).send({ error: 'Vérification d\'âge requise avant KYC' })
    }
    const session = await createIdentitySession(request.user.sub, user.email)
    await setKycStatus(request.user.sub, 'pending', session.sessionId)
    return session
  })

  app.get('/auth/kyc/status', { preHandler: [app.authenticate] }, async (request) => {
    const user = await findUserById(request.user.sub)
    return { kycStatus: user?.kycStatus ?? 'not_started' }
  })

  app.post('/auth/consents', { preHandler: [app.authenticate] }, async (request) => {
    const body = consentSchema.parse(request.body)
    const ip = request.ip ?? 'unknown'
    const ipHash = hashIp(ip)
    for (const c of body.consents) {
      await recordConsent(request.user.sub, c.type, c.version, ipHash)
    }
    return { recorded: body.consents.length }
  })

  app.get('/me/export', { preHandler: [app.authenticate] }, async (request) => {
    return exportUserData(request.user.sub)
  })

  app.delete('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    await softDeleteUser(request.user.sub)
    return reply.code(204).send()
  })
}
