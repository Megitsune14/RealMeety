import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL', 'postgresql://realmeety:realmeety@localhost:5432/realmeety'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripeIdentityEnabled: process.env.STRIPE_IDENTITY_ENABLED === 'true',
  revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? '',
  locationObfuscationMeters: Number(process.env.LOCATION_OBFUSCATION_METERS ?? 75),
  locationTtlSeconds: Number(process.env.LOCATION_TTL_SECONDS ?? 90),
  positionRateLimitSeconds: Number(process.env.POSITION_RATE_LIMIT_SECONDS ?? 10),
}
