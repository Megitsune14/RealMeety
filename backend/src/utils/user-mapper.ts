import type { UserMinimal } from '@realmeety/shared'

interface UserRow {
  id: string
  email: string
  age: number | null
  orientation: string | null
  availability_status: string
  subscription_tier: string
  kyc_status: string
  created_at: Date
}

export function toUserMinimal(row: UserRow): UserMinimal {
  return {
    id: row.id,
    email: row.email,
    age: row.age,
    orientation: row.orientation as UserMinimal['orientation'],
    availabilityStatus: row.availability_status as UserMinimal['availabilityStatus'],
    subscriptionTier: row.subscription_tier as UserMinimal['subscriptionTier'],
    kycStatus: row.kyc_status as UserMinimal['kycStatus'],
    createdAt: row.created_at.toISOString(),
  }
}

export const USER_SELECT = `
  id, email, age, orientation, availability_status,
  subscription_tier, kyc_status, created_at
`
