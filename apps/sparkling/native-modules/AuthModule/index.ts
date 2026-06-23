/**
 * Stub — AuthModule
 * iOS: Keychain Services | Android: EncryptedSharedPreferences
 */
export interface AuthModuleSpec {
  saveTokens(accessToken: string, refreshToken: string): Promise<void>
  loadTokens(): Promise<{ accessToken: string; refreshToken: string } | null>
  clearTokens(): Promise<void>
}
