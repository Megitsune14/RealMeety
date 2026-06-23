/**
 * Stub iOS — LocationModule
 * Implémenter dans le projet Sparkling iOS avec CLLocationManager.
 * @see apps/sparkling/README.md
 */
export interface LocationModuleSpec {
  requestPermission(): Promise<boolean>
  getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number }>
  startWatching(callbackId: string): void
  stopWatching(): void
}
