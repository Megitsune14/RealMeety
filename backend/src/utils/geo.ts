import { config } from '../config.js'

export function obfuscateCoordinates(
  lat: number,
  lng: number,
  meters = config.locationObfuscationMeters,
): { lat: number; lng: number } {
  const latOffset = (meters / 111_320) * (Math.random() * 2 - 1)
  const lngOffset =
    (meters / (111_320 * Math.cos((lat * Math.PI) / 180))) * (Math.random() * 2 - 1)
  return {
    lat: Math.round((lat + latOffset) * 1e5) / 1e5,
    lng: Math.round((lng + lngOffset) * 1e5) / 1e5,
  }
}

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i)
    hash |= 0
  }
  return `ip_${Math.abs(hash)}`
}
