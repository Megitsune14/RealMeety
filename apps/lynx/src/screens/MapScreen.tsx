import { useCallback, useEffect, useRef } from '@lynx-js/react'
import { SUBSCRIPTION_LIMITS } from '@realmeety/shared'
import { useApp } from '../context/AppContext.js'
import { MapCanvas } from '../components/MapCanvas.js'
import { AvailabilityToggle } from '../components/AvailabilityToggle.js'
import { FilterSheet } from '../components/FilterSheet.js'
import { updateProfile, updateLocation, fetchNearby, fetchLimits } from '../services/api.js'
import { LocationNative } from '../native/modules.js'
import { PresenceWebSocket } from '../services/presence-ws.js'

export function MapScreen() {
  const {
    user,
    markers,
    setMarkers,
    filters,
    setFilters,
    userLat,
    userLng,
    setLocation,
    isAvailable,
    setAvailable,
    navigate,
    setError,
  } = useApp()
  const wsRef = useRef<PresenceWebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tier = user?.subscriptionTier ?? 'free'
  const radius = SUBSCRIPTION_LIMITS[tier].radiusMeters

  const refreshMarkers = useCallback(async () => {
    'background only'
    try {
      const bounds = {
        north: userLat + 0.02,
        south: userLat - 0.02,
        east: userLng + 0.02,
        west: userLng - 0.02,
      }
      const nearby = await fetchNearby(userLat, userLng, bounds, filters)
      setMarkers(nearby)
      wsRef.current?.subscribe(userLat, userLng, bounds, filters)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur carte')
    }
  }, [userLat, userLng, filters, setMarkers, setError])

  useEffect(() => {
    'background only'
    const ws = new PresenceWebSocket()
    ws.connect(setMarkers)
    wsRef.current = ws
    refreshMarkers()
    return () => {
      ws.disconnect()
    }
  }, [])

  useEffect(() => {
    'background only'
    refreshMarkers()
  }, [filters, userLat, userLng])

  const toggleAvailability = useCallback(async () => {
    'background only'
    setError(null)
    try {
      if (!isAvailable) {
        const limits = await fetchLimits()
        if (!limits.canGoAvailable) {
          setError('Limite quotidienne atteinte — passez Premium')
          navigate('premium')
          return
        }
        const ok = await LocationNative.requestPermission()
        if (!ok) return
        const pos = await LocationNative.getCurrentPosition()
        setLocation(pos.lat, pos.lng)
        await updateProfile({ availabilityStatus: 'available' })
        setAvailable(true)
        await updateLocation(pos.lat, pos.lng)
        LocationNative.startWatching(async p => {
          setLocation(p.lat, p.lng)
          await updateLocation(p.lat, p.lng)
        })
        intervalRef.current = setInterval(refreshMarkers, 15000)
      } else {
        await updateProfile({ availabilityStatus: 'offline' })
        setAvailable(false)
        LocationNative.stopWatching()
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur disponibilité')
    }
  }, [isAvailable, setAvailable, setLocation, navigate, setError, refreshMarkers])

  return (
    <view className='Screen Screen--map'>
      <view className='MapHeader'>
        <text className='Brand Brand--small'>RealMeety</text>
        <view className='MapHeader__actions'>
          <view className='IconButton' bindtap={() => navigate('settings')}>
            <text>⚙</text>
          </view>
          <view className='IconButton' bindtap={() => navigate('premium')}>
            <text>★</text>
          </view>
        </view>
      </view>
      <MapCanvas
        markers={markers}
        userLat={userLat}
        userLng={userLng}
        radiusMeters={radius}
      />
      <FilterSheet filters={filters} onChange={setFilters} />
      <AvailabilityToggle isAvailable={isAvailable} onToggle={toggleAvailability} />
    </view>
  )
}
