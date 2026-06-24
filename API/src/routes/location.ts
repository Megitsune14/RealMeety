import { Hono } from 'hono';
import { ObjectId } from 'mongodb';
import { authMiddleware, type AuthVariables } from '../middleware/auth.js';
import {
  availabilityCollection,
  consentsCollection,
  usersCollection,
} from '../db/mongo.js';
import { ConsentType } from '../models/consent.js';
import { AvailabilityStatus, toPublicUser } from '../models/user.js';
import { locationSchema, nearbyQuerySchema, consentSchema } from '../validators/auth.js';
import { parseJson, parseQuery } from '../utils/validation.js';
import { locationRateLimit } from '../middleware/rateLimit.js';
import { clusterByGeohash, nearbyCacheKey } from '../services/geohash.js';
import { cacheGet, cacheSet } from '../db/redis.js';
import { logAudit } from '../services/audit.js';
import { isInsideBetaZone } from '../services/beta.js';

const LOCATION_TTL_MINUTES = 30;
const MAP_CACHE_TTL = 15;

const location = new Hono<{ Variables: AuthVariables }>();

location.use('/*', authMiddleware);
location.put('/', locationRateLimit(), async (c) => {
  const user = c.get('user');
  const data = await parseJson(c, locationSchema);
  if (data instanceof Response) return data;

  if (user.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
    return c.json({ error: 'Activez votre disponibilité avant de partager votre position' }, 400);
  }

  const geoConsent = await consentsCollection().findOne({
    userId: user._id,
    type: ConsentType.GEOLOCATION,
    granted: true,
    revokedAt: null,
  });

  if (!geoConsent) {
    return c.json({ error: 'Consentement géolocalisation requis' }, 403);
  }

  if (!isInsideBetaZone(data.lat, data.lng)) {
    return c.json({
      error: 'La beta est limitée à une zone géographique. Rendez-vous dans la zone de test.',
    }, 403);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCATION_TTL_MINUTES * 60 * 1000);

  await availabilityCollection().updateOne(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        status: AvailabilityStatus.AVAILABLE,
        sexualOrientation: user.sexualOrientation,
        location: {
          type: 'Point',
          coordinates: [data.lng, data.lat],
        },
        locationUpdatedAt: now,
        expiresAt,
        accuracyMeters: data.accuracyMeters ?? 50,
      },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true },
  );

  await logAudit('location.updated', { userId: user._id });

  return c.json({ message: 'Position mise à jour', expiresAt: expiresAt.toISOString() });
});

location.delete('/', async (c) => {
  const user = c.get('user');
  await availabilityCollection().deleteMany({ userId: user._id });
  await logAudit('location.deleted', { userId: user._id });
  return c.json({ message: 'Position supprimée' });
});

const map = new Hono();

map.get('/nearby', async (c) => {
  const query = parseQuery(c, nearbyQuerySchema);
  if (query instanceof Response) return query;

  const cacheKey = nearbyCacheKey(query.lat, query.lng, query.radius ?? 1000, query.orientation);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const filter: Record<string, unknown> = {
    status: AvailabilityStatus.AVAILABLE,
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [query.lng, query.lat] },
        $maxDistance: query.radius,
      },
    },
  };

  if (query.orientation) {
    filter.sexualOrientation = query.orientation;
  }

  const sessions = await availabilityCollection()
    .find(filter)
    .limit(500)
    .toArray();

  const points = sessions.map((s) => ({
    lat: s.location.coordinates[1],
    lng: s.location.coordinates[0],
  }));

  const clusters = clusterByGeohash(points);

  const response = {
    count: sessions.length,
    radius: query.radius,
    clusters,
  };

  await cacheSet(cacheKey, JSON.stringify(response), MAP_CACHE_TTL);

  return c.json(response);
});

const consentRoutes = new Hono<{ Variables: AuthVariables }>();

consentRoutes.use('/*', authMiddleware);

consentRoutes.get('/status', async (c) => {
  const user = c.get('user');
  const consents = await consentsCollection()
    .find({ userId: user._id })
    .toArray();

  return c.json({
    consents: consents.map((co) => ({
      type: co.type,
      granted: co.granted,
      version: co.version,
      grantedAt: co.grantedAt.toISOString(),
      revokedAt: co.revokedAt?.toISOString() ?? null,
    })),
  });
});

consentRoutes.post('/', async (c) => {
  const user = c.get('user');
  const data = await parseJson(c, consentSchema);
  if (data instanceof Response) return data;

  const now = new Date();
  const typeMap: Record<string, ConsentType> = {
    geolocation: ConsentType.GEOLOCATION,
    terms: ConsentType.TERMS,
    privacy: ConsentType.PRIVACY,
    marketing: ConsentType.MARKETING,
  };

  const consentType = typeMap[data.type];
  if (!consentType) return c.json({ error: 'Type de consentement invalide' }, 400);

  if (data.granted) {
    await consentsCollection().updateOne(
      { userId: user._id, type: consentType },
      {
        $set: {
          userId: user._id,
          type: consentType,
          granted: true,
          version: data.version,
          grantedAt: now,
          revokedAt: null,
        },
        $setOnInsert: { _id: new ObjectId() },
      },
      { upsert: true },
    );
  } else {
    await consentsCollection().updateOne(
      { userId: user._id, type: consentType },
      { $set: { granted: false, revokedAt: now } },
    );

    if (consentType === ConsentType.GEOLOCATION) {
      await availabilityCollection().deleteMany({ userId: user._id });
      await usersCollection().updateOne(
        { _id: user._id },
        { $set: { availabilityStatus: AvailabilityStatus.UNAVAILABLE } },
      );
    }
  }

  await logAudit('consent.updated', {
    userId: user._id,
    metadata: { type: data.type, granted: data.granted },
  });

  return c.json({ granted: data.granted, type: data.type });
});

export { location, map, consentRoutes as consent };
