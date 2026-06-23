import type { UserMinimal, AnonymousMarker, MapFilters, Orientation } from '@realmeety/shared'
import { API_BASE_URL } from '../config.js'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

let tokens: AuthTokens | null = null
let currentUser: UserMinimal | null = null

export function setTokens(t: AuthTokens | null): void {
  tokens = t
}

export function getTokens(): AuthTokens | null {
  return tokens
}

export function setCurrentUser(user: UserMinimal | null): void {
  currentUser = user
}

export function getCurrentUser(): UserMinimal | null {
  return currentUser
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  'background only'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && tokens?.refreshToken) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      headers.Authorization = `Bearer ${tokens!.accessToken}`
      const retry = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
      if (!retry.ok) throw new ApiError(retry.status, await retry.text())
      return retry.json() as Promise<T>
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`)
  }
}

async function refreshTokens(): Promise<boolean> {
  'background only'
  if (!tokens?.refreshToken) return false
  try {
    const data = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).then(r => r.json()) as AuthTokens
    tokens = data
    return true
  } catch {
    tokens = null
    return false
  }
}

export async function register(email: string, password: string): Promise<{ userId: string } & AuthTokens> {
  'background only'
  const data = await request<{ userId: string } & AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  tokens = data
  return data
}

export async function login(email: string, password: string): Promise<{ userId: string } & AuthTokens> {
  'background only'
  const data = await request<{ userId: string } & AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  tokens = data
  return data
}

export async function verifyAge(dateOfBirth: string): Promise<{ age: number }> {
  'background only'
  return request('/auth/verify-age', {
    method: 'POST',
    body: JSON.stringify({ dateOfBirth }),
  })
}

export async function startKyc(): Promise<{ sessionId: string; url: string; mock?: boolean }> {
  'background only'
  return request('/auth/kyc/start', { method: 'POST', body: '{}' })
}

export async function getKycStatus(): Promise<{ kycStatus: string }> {
  'background only'
  return request('/auth/kyc/status')
}

export async function completeMockKyc(userId: string): Promise<void> {
  'background only'
  await fetch(`${API_BASE_URL}/webhooks/kyc/mock-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
}

export async function recordConsents(
  consents: Array<{ type: string; version: string }>,
): Promise<void> {
  'background only'
  await request('/auth/consents', {
    method: 'POST',
    body: JSON.stringify({ consents }),
  })
}

export async function fetchMe(): Promise<UserMinimal & { limits?: { radiusMeters: number } }> {
  'background only'
  const user = await request<UserMinimal & { limits?: { radiusMeters: number } }>('/me')
  currentUser = user
  return user
}

export async function updateProfile(data: {
  orientation?: Orientation
  availabilityStatus?: string
}): Promise<UserMinimal> {
  'background only'
  const user = await request<UserMinimal>('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  currentUser = user
  return user
}

export async function updateLocation(lat: number, lng: number): Promise<void> {
  'background only'
  await request('/me/location', {
    method: 'PUT',
    body: JSON.stringify({ lat, lng }),
  })
}

export async function fetchNearby(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number },
  filters: MapFilters,
): Promise<AnonymousMarker[]> {
  'background only'
  const data = await request<{ markers: AnonymousMarker[] }>('/presence/nearby', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, bounds, filters }),
  })
  return data.markers
}

export async function fetchLimits(): Promise<{
  canGoAvailable: boolean
  usedAvailabilityMinutes: number
  maxDailyAvailabilityMinutes: number | null
  radiusMeters: number
  tier: string
}> {
  'background only'
  return request('/me/limits')
}

export async function deleteAccount(): Promise<void> {
  'background only'
  await request('/me', { method: 'DELETE' })
  tokens = null
  currentUser = null
}

export async function exportAccountData(): Promise<unknown> {
  'background only'
  return request('/me/export')
}

export async function mockUpgradePremium(): Promise<void> {
  'background only'
  await request('/billing/mock/upgrade', { method: 'POST', body: '{}' })
}

export async function fetchPlans(): Promise<unknown> {
  'background only'
  return request('/billing/plans')
}
