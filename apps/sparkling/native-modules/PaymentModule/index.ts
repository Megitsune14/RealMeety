/**
 * Stub — PaymentModule via RevenueCat
 */
export interface PaymentModuleSpec {
  purchase(productId: string): Promise<{ success: boolean }>
  restorePurchases(): Promise<{ tier: string }>
  getSubscriptionTier(): Promise<string>
}

export const REVENUECAT_PRODUCTS = [
  'realmeety_premium_monthly',
  'realmeety_premium_yearly',
] as const
