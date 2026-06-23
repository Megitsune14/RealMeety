/**
 * Stub — MapView Custom Element
 * iOS: MKMapView | Android: GoogleMap
 */
export interface MapMarker {
  sessionToken: string
  lat: number
  lng: number
}

export interface MapViewSpec {
  setMarkers(markers: MapMarker[]): void
  setUserLocation(lat: number, lng: number): void
  setRadiusMeters(radius: number): void
}
