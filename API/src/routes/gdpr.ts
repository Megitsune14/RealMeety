import { Hono } from 'hono';
import { ObjectId } from 'mongodb';
import { authMiddleware, type AuthVariables } from '../middleware/auth.js';
import {
  usersCollection,
  availabilityCollection,
  consentsCollection,
  getDb,
} from '../db/mongo.js';
import { toPublicUser } from '../models/user.js';
import { logAudit } from '../services/audit.js';
import type { AuditLogDocument } from '../services/audit.js';

const gdpr = new Hono<{ Variables: AuthVariables }>();

gdpr.use('/*', authMiddleware);

gdpr.get('/export', async (c) => {
  const user = c.get('user');

  const consents = await consentsCollection().find({ userId: user._id }).toArray();
  const auditLogs = await getDb()
    .collection<AuditLogDocument>('audit_logs')
    .find({ userId: user._id })
    .limit(1000)
    .toArray();

  await logAudit('gdpr.export', { userId: user._id });

  return c.json({
    exportedAt: new Date().toISOString(),
    user: toPublicUser(user),
    consents: consents.map((co) => ({
      type: co.type,
      granted: co.granted,
      version: co.version,
      grantedAt: co.grantedAt.toISOString(),
      revokedAt: co.revokedAt?.toISOString() ?? null,
    })),
    activityLog: auditLogs.map((log) => ({
      action: log.action,
      createdAt: log.createdAt.toISOString(),
    })),
    note: 'Les données de localisation ne sont pas conservées après désactivation.',
  });
});

gdpr.delete('/account', async (c) => {
  const user = c.get('user');
  const now = new Date();

  await availabilityCollection().deleteMany({ userId: user._id });
  await consentsCollection().deleteMany({ userId: user._id });

  await usersCollection().updateOne(
    { _id: user._id },
    {
      $set: {
        deletedAt: now,
        email: `deleted_${user._id.toHexString()}@removed.local`,
        availabilityStatus: 'unavailable',
        updatedAt: now,
      },
    },
  );

  await logAudit('gdpr.account_deleted', { userId: user._id });

  return c.json({ message: 'Compte supprimé définitivement' });
});

gdpr.get('/consents', async (c) => {
  const user = c.get('user');
  const consents = await consentsCollection().find({ userId: user._id }).toArray();
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

export default gdpr;
