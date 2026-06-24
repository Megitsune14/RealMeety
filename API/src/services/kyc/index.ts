import { ObjectId } from 'mongodb';
import { getEnv, isStripeKycEnabled } from '../../config/env.js';
import { usersCollection } from '../../db/mongo.js';
import { logAudit } from '../audit.js';
import {
  createStripeVerificationSession,
  getStripeVerificationSession,
} from './stripe.js';

export interface IdentitySessionResult {
  sessionId: string;
  url: string | null;
  status: string;
  provider: 'stripe' | 'mock';
}

export async function startIdentityVerification(
  userId: ObjectId,
  email: string,
): Promise<IdentitySessionResult> {
  if (isStripeKycEnabled()) {
    const session = await createStripeVerificationSession(userId.toHexString(), email);
    await usersCollection().updateOne(
      { _id: userId },
      { $set: { identityProviderRef: session.sessionId, updatedAt: new Date() } },
    );
    await logAudit('identity.session_started', {
      userId,
      metadata: { provider: 'stripe', sessionId: session.sessionId },
    });
    return session;
  }

  return {
    sessionId: `mock_${userId.toHexString()}`,
    url: null,
    status: 'requires_input',
    provider: 'mock',
  };
}

export async function completeMockVerification(userId: ObjectId) {
  const now = new Date();
  await usersCollection().updateOne(
    { _id: userId },
    {
      $set: {
        isIdentityVerified: true,
        identityProviderRef: 'mock-verification',
        updatedAt: now,
      },
    },
  );
  await logAudit('identity.verified', { userId, metadata: { provider: 'mock' } });
}

export async function syncIdentityStatus(
  userId: ObjectId,
  sessionId: string | null,
): Promise<{ verified: boolean; status: string }> {
  if (!isStripeKycEnabled() || !sessionId?.startsWith('vs_')) {
    const user = await usersCollection().findOne({ _id: userId });
    return {
      verified: user?.isIdentityVerified ?? false,
      status: user?.isIdentityVerified ? 'verified' : 'requires_input',
    };
  }

  const { status, verified } = await getStripeVerificationSession(sessionId);

  if (verified) {
    await usersCollection().updateOne(
      { _id: userId },
      {
        $set: {
          isIdentityVerified: true,
          identityProviderRef: sessionId,
          updatedAt: new Date(),
        },
      },
    );
    await logAudit('identity.verified', { userId, metadata: { provider: 'stripe', sessionId } });
  }

  return { verified, status };
}

export async function handleStripeVerified(userId: string, sessionId: string): Promise<void> {
  const id = new ObjectId(userId);
  await usersCollection().updateOne(
    { _id: id },
    {
      $set: {
        isIdentityVerified: true,
        identityProviderRef: sessionId,
        updatedAt: new Date(),
      },
    },
  );
  await logAudit('identity.webhook_verified', {
    userId: id,
    metadata: { provider: 'stripe', sessionId },
  });
}

export function getKycProvider(): 'stripe' | 'mock' {
  return isStripeKycEnabled() ? 'stripe' : 'mock';
}
