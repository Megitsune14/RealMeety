import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/realmeety'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),
  LEGAL_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().default('http://localhost:8080'),
  KYC_PROVIDER: z.enum(['mock', 'stripe']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  BETA_MODE: z.preprocess(
    (val) => val === true || val === 'true',
    z.boolean(),
  ).default(false),
  BETA_CENTER_LAT: z.coerce.number().default(48.8566),
  BETA_CENTER_LNG: z.coerce.number().default(2.3522),
  BETA_RADIUS_METERS: z.coerce.number().default(5000),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function resetEnvCache(): void {
  cached = null;
}

export function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  cached = result.data;

  if (cached.KYC_PROVIDER === 'stripe' && !cached.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY required when KYC_PROVIDER=stripe');
  }

  return cached;
}

export function isStripeKycEnabled(): boolean {
  const env = getEnv();
  return env.KYC_PROVIDER === 'stripe' && !!env.STRIPE_SECRET_KEY;
}
