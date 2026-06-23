import { createContext, useContext, useState, useCallback, type ReactNode } from '@lynx-js/react'
import type { UserMinimal, AnonymousMarker, MapFilters, Orientation } from '@realmeety/shared'

export type Screen =
  | 'welcome'
  | 'register'
  | 'login'
  | 'age'
  | 'orientation'
  | 'consent'
  | 'location-permission'
  | 'kyc'
  | 'kyc-pending'
  | 'map'
  | 'settings'
  | 'premium'
  | 'legal'

interface AppState {
  screen: Screen
  user: UserMinimal | null
  markers: AnonymousMarker[]
  filters: MapFilters
  userLat: number
  userLng: number
  isAvailable: boolean
  error: string | null
}

interface AppContextValue extends AppState {
  navigate: (screen: Screen) => void
  setUser: (user: UserMinimal | null) => void
  setMarkers: (markers: AnonymousMarker[]) => void
  setFilters: (filters: MapFilters) => void
  setLocation: (lat: number, lng: number) => void
  setAvailable: (available: boolean) => void
  setError: (error: string | null) => void
}

const defaultFilters: MapFilters = {
  ageMin: 18,
  ageMax: 45,
  orientations: [],
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [user, setUser] = useState<UserMinimal | null>(null)
  const [markers, setMarkers] = useState<AnonymousMarker[]>([])
  const [filters, setFilters] = useState<MapFilters>(defaultFilters)
  const [userLat, setUserLat] = useState(48.8566)
  const [userLng, setUserLng] = useState(2.3522)
  const [isAvailable, setAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useCallback((s: Screen) => {
    'background only'
    setScreen(s)
    setError(null)
  }, [])

  const setLocation = useCallback((lat: number, lng: number) => {
    'background only'
    setUserLat(lat)
    setUserLng(lng)
  }, [])

  return (
    <AppContext.Provider
      value={{
        screen,
        user,
        markers,
        filters,
        userLat,
        userLng,
        isAvailable,
        error,
        navigate,
        setUser,
        setMarkers,
        setFilters,
        setLocation,
        setAvailable,
        setError,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { Orientation }
