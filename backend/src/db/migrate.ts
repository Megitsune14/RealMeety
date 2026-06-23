import { pool } from './pool.js'

const migrations = `
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  age INTEGER,
  orientation TEXT CHECK (orientation IN ('hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say')),
  availability_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (availability_status IN ('offline', 'available', 'paused')),
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium')),
  kyc_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'failed')),
  stripe_customer_id TEXT,
  stripe_identity_session_id TEXT,
  location GEOGRAPHY(POINT, 4326),
  location_updated_at TIMESTAMPTZ,
  session_token TEXT,
  daily_availability_seconds INTEGER NOT NULL DEFAULT 0,
  daily_availability_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL
    CHECK (consent_type IN ('terms', 'privacy', 'location', 'kyc', 'marketing')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location)
  WHERE deleted_at IS NULL AND availability_status = 'available';
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
`

export async function migrate(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(migrations)
    console.info('Migrations applied successfully')
  } finally {
    client.release()
  }
}

const isMain = process.argv[1]?.includes('migrate')
if (isMain) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
