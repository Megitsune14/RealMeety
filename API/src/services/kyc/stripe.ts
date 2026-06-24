import Stripe from 'stripe';
import { getEnv } from '../../config/env.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const { STRIPE_SECRET_KEY } = getEnv();
    if (!STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export interface IdentitySessionResult {
  sessionId: string;
  url: string | null;
  status: string;
  provider: 'stripe' | 'mock';
}

export async function createStripeVerificationSession(
  userId: string,
  email: string,
): Promise<IdentitySessionResult> {
  const stripe = getStripe();
  const { APP_URL } = getEnv();

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId },
    options: {
      document: {
        require_matching_selfie: true,
      },
    },
    return_url: `${APP_URL}/identity/callback`,
  });

  return {
    sessionId: session.id,
    url: session.url,
    status: session.status,
    provider: 'stripe',
  };
}

export async function getStripeVerificationSession(
  sessionId: string,
): Promise<{ status: string; verified: boolean }> {
  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.retrieve(sessionId);
  return {
    status: session.status,
    verified: session.status === 'verified',
  };
}

export function constructStripeEvent(
  payload: string,
  signature: string,
): Stripe.Event {
  const { STRIPE_WEBHOOK_SECRET } = getEnv();
  if (!STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}
