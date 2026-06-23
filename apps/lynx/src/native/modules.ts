import type { AnonymousMarker } from '@realmeety/shared'

export interface LocationModule {
  requestPermission(): Promise<boolean>
  getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number }>
  startWatching(callback: (pos: { lat: number; lng: number }) => void): void
  stopWatching(): void
}

export interface AuthModule {
  saveTokens(accessToken: string, refreshToken: string): Promise<void>
  loadTokens(): Promise<{ accessToken: string; refreshToken: string } | null>
  clearTokens(): Promise<void>
}

export interface PaymentModule {
  purchase(productId: string): Promise<{ success: boolean }>
  restorePurchases(): Promise<{ tier: string }>
  getSubscriptionTier(): Promise<string>
}

export interface MapViewProps {
  markers: AnonymousMarker[]
  userLat: number
  userLng: number
  radiusMeters: number
}

type RealMeetyNativeModules = {
  LocationModule?: LocationModule
  AuthModule?: AuthModule
  PaymentModule?: PaymentModule
}

function getNativeModules(): RealMeetyNativeModules {
  'background only'
  return (globalThis as { NativeModules?: RealMeetyNativeModules }).NativeModules ?? {}
}

const mockParis = { lat: 48.8566, lng: 2.3522 }

export const LocationNative: LocationModule = {
  async requestPermission() {
    'background only'
    return getNativeModules().LocationModule?.requestPermission() ?? true
  },
  async getCurrentPosition() {
    'background only'
    const native = getNativeModules().LocationModule
    if (native) return native.getCurrentPosition()
    return { ...mockParis, accuracy: 10 }
  },
  startWatching(callback) {
    'background only'
    const native = getNativeModules().LocationModule
    if (native) {
      native.startWatching(callback)
      return
    }
    callback(mockParis)
  },
  stopWatching() {
    'background only'
    getNativeModules().LocationModule?.stopWatching()
  },
}

export const AuthNative: AuthModule = {
  async saveTokens(accessToken, refreshToken) {
    'background only'
    const native = getNativeModules().AuthModule
    if (native) {
      await native.saveTokens(accessToken, refreshToken)
      return
    }
    lynx.setSharedData('accessToken', accessToken)
    lynx.setSharedData('refreshToken', refreshToken)
  },
  async loadTokens() {
    'background only'
    const native = getNativeModules().AuthModule
    if (native) return native.loadTokens()
    const accessToken = lynx.getSharedData('accessToken') as string | undefined
    const refreshToken = lynx.getSharedData('refreshToken') as string | undefined
    if (accessToken && refreshToken) return { accessToken, refreshToken }
    return null
  },
  async clearTokens() {
    'background only'
    const native = getNativeModules().AuthModule
    if (native) {
      await native.clearTokens()
      return
    }
    lynx.setSharedData('accessToken', '')
    lynx.setSharedData('refreshToken', '')
  },
}

export const PaymentNative: PaymentModule = {
  async purchase(productId) {
    'background only'
    const native = getNativeModules().PaymentModule
    if (native) return native.purchase(productId)
    console.info('Mock purchase:', productId)
    return { success: true }
  },
  async restorePurchases() {
    'background only'
    const native = getNativeModules().PaymentModule
    if (native) return native.restorePurchases()
    return { tier: 'free' }
  },
  async getSubscriptionTier() {
    'background only'
    const native = getNativeModules().PaymentModule
    if (native) return native.getSubscriptionTier()
    return 'free'
  },
}
