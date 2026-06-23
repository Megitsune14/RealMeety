import type { AnonymousMarker } from '@realmeety/shared'

interface MapCanvasProps {
  markers: AnonymousMarker[]
  userLat: number
  userLng: number
  radiusMeters: number
}

export function MapCanvas({ markers, userLat, userLng, radiusMeters }: MapCanvasProps) {
  return (
    <view className='MapCanvas'>
      <view className='MapCanvas__grid'>
        {markers.map(m => (
          <view
            key={m.sessionToken}
            className='MapCanvas__marker'
            style={{
              left: `${50 + (m.lng - userLng) * 8000}rpx`,
              top: `${50 - (m.lat - userLat) * 8000}rpx`,
            }}
          />
        ))}
        <view className='MapCanvas__user' />
        <view
          className='MapCanvas__radius'
          style={{ width: `${radiusMeters / 5}rpx`, height: `${radiusMeters / 5}rpx` }}
        />
      </view>
      <text className='MapCanvas__hint'>
        {markers.length} personne{markers.length !== 1 ? 's' : ''} disponible{markers.length !== 1 ? 's' : ''} à proximité
      </text>
    </view>
  )
}
