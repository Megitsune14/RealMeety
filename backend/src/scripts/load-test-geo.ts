/**
 * Simulateur de charge géo — 1000 utilisateurs bbox Paris
 * Usage: npm run load-test --workspace=@realmeety/backend
 */
import { haversineDistanceMeters, obfuscateCoordinates } from '../utils/geo.js'

const PARIS = { lat: 48.8566, lng: 2.3522 }
const USER_COUNT = 1000

console.info(`Simulating ${USER_COUNT} geo queries around Paris...`)

const start = performance.now()
let totalMarkers = 0

for (let i = 0; i < USER_COUNT; i++) {
  const lat = PARIS.lat + (Math.random() - 0.5) * 0.04
  const lng = PARIS.lng + (Math.random() - 0.5) * 0.04
  const obfuscated = obfuscateCoordinates(lat, lng)
  const dist = haversineDistanceMeters(PARIS.lat, PARIS.lng, obfuscated.lat, obfuscated.lng)
  if (dist < 2000) totalMarkers++
}

const elapsed = performance.now() - start
console.info(`Processed ${USER_COUNT} users in ${elapsed.toFixed(0)}ms`)
console.info(`Markers within 2km: ${totalMarkers}`)
console.info(`Avg: ${(elapsed / USER_COUNT).toFixed(3)}ms/user`)
