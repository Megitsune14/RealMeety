import { getEnv } from '../config/env.js';

const EARTH_RADIUS_M = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideBetaZone(lat: number, lng: number): boolean {
  const env = getEnv();
  if (!env.BETA_MODE) return true;

  const dist = distanceMeters(lat, lng, env.BETA_CENTER_LAT, env.BETA_CENTER_LNG);
  return dist <= env.BETA_RADIUS_METERS;
}

export function getBetaZoneInfo() {
  const env = getEnv();
  return {
    enabled: env.BETA_MODE,
    center: { lat: env.BETA_CENTER_LAT, lng: env.BETA_CENTER_LNG },
    radiusMeters: env.BETA_RADIUS_METERS,
    message: env.BETA_MODE
      ? `Beta limitée à ${env.BETA_RADIUS_METERS / 1000} km autour du point de test`
      : null,
  };
}
