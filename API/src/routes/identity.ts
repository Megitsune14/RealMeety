import { Hono } from 'hono';
import { authMiddleware, type AuthVariables } from '../middleware/auth.js';
import { usersCollection } from '../db/mongo.js';
import { toPublicUser } from '../models/user.js';
import {
  startIdentityVerification,
  completeMockVerification,
  syncIdentityStatus,
  handleStripeVerified,
  getKycProvider,
} from '../services/kyc/index.js';
import { constructStripeEvent } from '../services/kyc/stripe.js';
import { logAudit } from '../services/audit.js';

const identity = new Hono<{ Variables: AuthVariables }>();

identity.get('/status', authMiddleware, async (c) => {
  const user = c.get('user');
  const { verified, status } = await syncIdentityStatus(
    user._id,
    user.identityProviderRef,
  );

  const updated = await usersCollection().findOne({ _id: user._id });

  return c.json({
    provider: getKycProvider(),
    isIdentityVerified: updated?.isIdentityVerified ?? verified,
    status,
    identityProviderRef: user.identityProviderRef,
  });
});

identity.post('/start', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user.isIdentityVerified) {
    return c.json({
      message: 'Identité déjà vérifiée',
      user: toPublicUser(user),
      provider: getKycProvider(),
    });
  }

  const session = await startIdentityVerification(user._id, user.email);

  return c.json({
    provider: session.provider,
    sessionId: session.sessionId,
    url: session.url,
    status: session.status,
    message: session.provider === 'stripe'
      ? 'Ouvrez le lien pour vérifier votre identité'
      : 'Mode développement : vérification locale',
  });
});

/** Mock uniquement — désactivé si KYC_PROVIDER=stripe */
identity.post('/verify', authMiddleware, async (c) => {
  const user = c.get('user');

  if (getKycProvider() === 'stripe') {
    return c.json({
      error: 'Utilisez POST /identity/start et complétez la vérification Stripe',
    }, 400);
  }

  if (user.isIdentityVerified) {
    return c.json({ message: 'Identité déjà vérifiée', user: toPublicUser(user) });
  }

  await completeMockVerification(user._id);
  const updated = await usersCollection().findOne({ _id: user._id });
  if (!updated) return c.json({ error: 'Erreur interne' }, 500);

  return c.json({
    message: 'Identité vérifiée',
    user: toPublicUser(updated),
  });
});

/** Webhook Stripe Identity — pas d'auth JWT */
identity.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) return c.json({ error: 'Signature manquante' }, 400);

  try {
    const body = await c.req.text();
    const event = constructStripeEvent(body, signature);

    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as { id: string; metadata: { userId?: string } };
      const userId = session.metadata?.userId;
      if (userId) {
        await handleStripeVerified(userId, session.id);
      }
    }

    if (event.type === 'identity.verification_session.requires_input') {
      await logAudit('identity.requires_input', {
        metadata: { eventId: event.id },
      });
    }

    return c.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return c.json({ error: 'Webhook invalide' }, 400);
  }
});

export default identity;
