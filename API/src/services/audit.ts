import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongo.js';
import { createHash } from 'crypto';

export interface AuditLogDocument {
  _id: ObjectId;
  userId: ObjectId | null;
  action: string;
  ipHash: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export async function logAudit(
  action: string,
  opts: {
    userId?: ObjectId;
    ip?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const safeMetadata = { ...opts.metadata };
  delete safeMetadata.lat;
  delete safeMetadata.lng;
  delete safeMetadata.location;
  delete safeMetadata.coordinates;

  await getDb().collection<AuditLogDocument>('audit_logs').insertOne({
    _id: new ObjectId(),
    userId: opts.userId ?? null,
    action,
    ipHash: opts.ip ? hashIp(opts.ip) : 'unknown',
    metadata: safeMetadata,
    createdAt: new Date(),
  });
}
