import { MongoClient, Db, Collection } from 'mongodb';
import { getEnv } from '../config/env.js';
import type { UserDocument } from '../models/user.js';
import type { AvailabilitySessionDocument } from '../models/availability.js';
import type { ConsentDocument } from '../models/consent.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) return db;

  const { MONGODB_URI } = getEnv();
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(database: Db): Promise<void> {
  await database.collection<UserDocument>('users').createIndex({ email: 1 }, { unique: true });
  await database.collection<AvailabilitySessionDocument>('availability_sessions').createIndex(
    { location: '2dsphere' },
  );
  await database.collection<AvailabilitySessionDocument>('availability_sessions').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
  await database.collection<ConsentDocument>('consents').createIndex({ userId: 1, type: 1 });
  await database.collection('audit_logs').createIndex({ userId: 1, createdAt: -1 });
  await database.collection('audit_logs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

export function usersCollection(): Collection<UserDocument> {
  return getDb().collection<UserDocument>('users');
}

export function availabilityCollection(): Collection<AvailabilitySessionDocument> {
  return getDb().collection<AvailabilitySessionDocument>('availability_sessions');
}

export function consentsCollection(): Collection<ConsentDocument> {
  return getDb().collection<ConsentDocument>('consents');
}
