import { pool } from './pool.js'
import { hashPassword, createUser, setUserAge, setKycStatus, recordConsent } from '../modules/auth/service.js'

export async function seed(): Promise<void> {
  const email = 'demo@realmeety.app'
  const client = await pool.connect()
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      console.info('Demo user already exists')
      return
    }
    const passwordHash = await hashPassword('password123')
    const user = await createUser(email, passwordHash)
    await setUserAge(user.id, 28)
    await client.query(`UPDATE users SET orientation = 'bi' WHERE id = $1`, [user.id])
    await setKycStatus(user.id, 'verified')
    for (const type of ['terms', 'privacy', 'location', 'kyc']) {
      await recordConsent(user.id, type, '1.0.0')
    }
    console.info('Demo user seeded:', email, '/ password123')
  } finally {
    client.release()
  }
}

const isMain = process.argv[1]?.includes('seed')
if (isMain) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
