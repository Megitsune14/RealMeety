export type Orientation =
  | 'hetero'
  | 'homo'
  | 'bi'
  | 'pan'
  | 'other'
  | 'prefer_not_to_say'

export type AvailabilityStatus = 'offline' | 'available' | 'paused'

export type SubscriptionTier = 'free' | 'premium'

export type KycStatus = 'pending' | 'verified' | 'failed' | 'not_started'

export type ConsentType =
  | 'terms'
  | 'privacy'
  | 'location'
  | 'kyc'
  | 'marketing'

export interface UserMinimal {
  id: string
  email: string
  age: number | null
  orientation: Orientation | null
  availabilityStatus: AvailabilityStatus
  subscriptionTier: SubscriptionTier
  kycStatus: KycStatus
  createdAt: string
}

export interface AnonymousMarker {
  sessionToken: string
  lat: number
  lng: number
  ageBucket: string
  orientationBucket: string
  distanceMeters?: number
}

export interface MapFilters {
  ageMin: number
  ageMax: number
  orientations: Orientation[]
}

export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface SubscriptionLimits {
  radiusMeters: number
  maxDailyAvailabilityMinutes: number | null
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    radiusMeters: 500,
    maxDailyAvailabilityMinutes: 30,
  },
  premium: {
    radiusMeters: 2000,
    maxDailyAvailabilityMinutes: null,
  },
}

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  hetero: 'Hétérosexuel(le)',
  homo: 'Homosexuel(le)',
  bi: 'Bisexuel(le)',
  pan: 'Pansexuel(le)',
  other: 'Autre',
  prefer_not_to_say: 'Préfère ne pas dire',
}

export function isAdult(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age >= 18
}

export function computeAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function toAgeBucket(age: number): string {
  const bucketStart = Math.floor(age / 5) * 5
  return `${bucketStart}-${bucketStart + 4}`
}

export function orientationsCompatible(
  a: Orientation,
  b: Orientation,
  viewerPreference: Orientation[],
): boolean {
  if (viewerPreference.length === 0) return true
  return viewerPreference.includes(b)
}
