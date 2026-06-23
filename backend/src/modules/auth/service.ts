import crypto from 'node:crypto'
import argon2 from 'argon2'
import { query } from '../../db/pool.js'
import { toUserMinimal, USER_SELECT } from '../../utils/user-mapper.js'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url')
}

export function generateSessionToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function createUser(email: string, passwordHash: string) {
  const result = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    [email.toLowerCase().trim(), passwordHash],
  )
  return result.rows[0]
}

export async function findUserByEmail(email: string) {
  const result = await query(
    `SELECT id, email, password_hash, age, orientation, availability_status,
      subscription_tier, kyc_status, created_at
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase().trim()],
  )
  return result.rows[0] as Record<string, unknown> | undefined
}

export async function findUserById(id: string) {
  const result = await query(
    `SELECT ${USER_SELECT} FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  const row = result.rows[0]
  return row ? toUserMinimal(row as Parameters<typeof toUserMinimal>[0]) : null
}

export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  )
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [hashToken(token)])
}

export async function validateRefreshToken(token: string): Promise<string | null> {
  const result = await query<{ user_id: string }>(
    `SELECT user_id FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()`,
    [hashToken(token)],
  )
  return result.rows[0]?.user_id ?? null
}

export async function setUserAge(userId: string, age: number): Promise<void> {
  await query(
    `UPDATE users SET age = $2, updated_at = NOW() WHERE id = $1`,
    [userId, age],
  )
}

export async function setKycStatus(
  userId: string,
  status: string,
  sessionId?: string,
): Promise<void> {
  await query(
    `UPDATE users SET kyc_status = $2, stripe_identity_session_id = COALESCE($3, stripe_identity_session_id), updated_at = NOW()
     WHERE id = $1`,
    [userId, status, sessionId ?? null],
  )
}

export async function recordConsent(
  userId: string,
  consentType: string,
  version: string,
  ipHash?: string,
): Promise<void> {
  await query(
    `INSERT INTO consents (user_id, consent_type, version, ip_hash) VALUES ($1, $2, $3, $4)`,
    [userId, consentType, version, ipHash ?? null],
  )
}

export async function getConsents(userId: string) {
  const result = await query(
    `SELECT consent_type, version, accepted_at FROM consents WHERE user_id = $1 ORDER BY accepted_at`,
    [userId],
  )
  return result.rows
}

export async function softDeleteUser(userId: string): Promise<void> {
  await query(
    `UPDATE users SET deleted_at = NOW(), availability_status = 'offline', location = NULL, session_token = NULL, updated_at = NOW()
     WHERE id = $1`,
    [userId],
  )
  await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId])
}

export async function exportUserData(userId: string) {
  const user = await findUserById(userId)
  const consents = await getConsents(userId)
  return { user, consents }
}
