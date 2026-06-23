import Stripe from 'stripe'
import { config } from '../../config.js'

let stripe: Stripe | null = null

function getStripe(): Stripe | null {
  if (!config.stripeSecretKey || config.stripeSecretKey.startsWith('sk_test_placeholder')) {
    return null
  }
  if (!stripe) stripe = new Stripe(config.stripeSecretKey)
  return stripe
}

export async function createIdentitySession(
  userId: string,
  email: string,
): Promise<{ sessionId: string; url: string; mock?: boolean }> {
  const client = getStripe()
  if (!client || !config.stripeIdentityEnabled) {
    return {
      sessionId: `mock_kyc_${userId.slice(0, 8)}`,
      url: `realmeety://kyc/mock?userId=${userId}`,
      mock: true,
    }
  }
  const session = await client.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId },
    options: {
      document: { require_matching_selfie: true },
    },
    return_url: `realmeety://kyc/complete`,
  })
  return {
    sessionId: session.id,
    url: session.url ?? `https://verify.stripe.com/start/${session.client_secret}`,
  }
}

export async function handleStripeWebhook(
  payload: Buffer,
  signature: string,
): Promise<{ userId?: string; kycStatus?: string; subscriptionTier?: string } | null> {
  const client = getStripe()
  if (!client || !config.stripeWebhookSecret) return null

  const event = client.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret)

  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    return {
      userId: session.metadata?.userId,
      kycStatus: 'verified',
    }
  }
  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    if (session.last_error) {
      return { userId: session.metadata?.userId, kycStatus: 'failed' }
    }
  }
  return null
}
