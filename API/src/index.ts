import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { getEnv } from './config/env.js';
import { connectDatabase } from './db/mongo.js';
import { connectRedis } from './db/redis.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import { location, map, consent } from './routes/location.js';
import identity from './routes/identity.js';
import gdpr from './routes/gdpr.js';
import legal from './routes/legal.js';
import beta from './routes/beta.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

const app = new Hono();

app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: getEnv().CORS_ORIGIN,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', rateLimitMiddleware());

app.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    service: 'realmeety-api',
    timestamp: new Date().toISOString(),
  });
});

app.route('/auth', auth);
app.route('/users', users);
app.route('/location', location);
app.route('/map', map);
app.route('/consent', consent);
app.route('/identity', identity);
app.route('/gdpr', gdpr);
app.route('/legal', legal);
app.route('/beta', beta);

app.notFound((c) => c.json({ error: 'Route introuvable' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Erreur interne du serveur' }, 500);
});

async function main() {
  const { PORT } = getEnv();
  await connectDatabase();
  try {
    await connectRedis();
    console.log('Redis connected');
  } catch {
    console.warn('Redis unavailable — cache and rate limiting degraded');
  }

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`RealMeety API running on http://localhost:${info.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
