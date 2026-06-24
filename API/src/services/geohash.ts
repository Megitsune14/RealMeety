import ngeohash from 'ngeohash';

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  geohash: string;
}

export function clusterByGeohash(
  points: Array<{ lat: number; lng: number }>,
  precision = 6,
): MapCluster[] {
  const groups = new Map<string, { lat: number; lng: number; count: number }>();

  for (const point of points) {
    const hash = ngeohash.encode(point.lat, point.lng, precision);
    const existing = groups.get(hash);
    if (existing) {
      existing.count += 1;
      existing.lat = (existing.lat + point.lat) / 2;
      existing.lng = (existing.lng + point.lng) / 2;
    } else {
      groups.set(hash, { lat: point.lat, lng: point.lng, count: 1 });
    }
  }

  return Array.from(groups.entries()).map(([geohash, data]) => ({
    geohash,
    lat: Math.round(data.lat * 1e5) / 1e5,
    lng: Math.round(data.lng * 1e5) / 1e5,
    count: data.count,
  }));
}

export function nearbyCacheKey(
  lat: number,
  lng: number,
  radius: number,
  orientation?: string,
): string {
  const hash = ngeohash.encode(lat, lng, 5);
  return `map:nearby:${hash}:${radius}:${orientation ?? 'all'}`;
}
