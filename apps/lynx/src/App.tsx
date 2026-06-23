import { useEffect } from '@lynx-js/react'
import { AppProvider, useApp, type Screen } from './context/AppContext.js'
import { WelcomeScreen } from './screens/WelcomeScreen.js'
import { RegisterScreen } from './screens/RegisterScreen.js'
import { LoginScreen } from './screens/LoginScreen.js'
import { AgeVerificationScreen } from './screens/AgeVerificationScreen.js'
import { OrientationScreen } from './screens/OrientationScreen.js'
import { ConsentScreen } from './screens/ConsentScreen.js'
import { LocationPermissionScreen } from './screens/LocationPermissionScreen.js'
import {
  IdentityVerificationScreen,
  VerificationPendingScreen,
} from './screens/IdentityVerificationScreen.js'
import { MapScreen } from './screens/MapScreen.js'
import { SettingsScreen } from './screens/SettingsScreen.js'
import { PremiumScreen } from './screens/PremiumScreen.js'
import { LegalScreen } from './screens/LegalScreen.js'
import { AuthNative } from './native/modules.js'
import { setTokens, fetchMe } from './services/api.js'
import './App.css'

const screens: Record<Screen, () => JSX.Element> = {
  welcome: WelcomeScreen,
  register: RegisterScreen,
  login: LoginScreen,
  age: AgeVerificationScreen,
  orientation: OrientationScreen,
  consent: ConsentScreen,
  'location-permission': LocationPermissionScreen,
  kyc: IdentityVerificationScreen,
  'kyc-pending': VerificationPendingScreen,
  map: MapScreen,
  settings: SettingsScreen,
  premium: PremiumScreen,
  legal: LegalScreen,
}

function Router() {
  const { screen, setUser, navigate, error } = useApp()

  useEffect(() => {
    'background only'
    AuthNative.loadTokens().then(async stored => {
      if (!stored) return
      setTokens(stored)
      try {
        const user = await fetchMe()
        setUser(user)
        if (user.kycStatus === 'verified') navigate('map')
      } catch {
        setTokens(null)
      }
    })
  }, [])

  const ScreenComponent = screens[screen]

  return (
    <view className='AppRoot'>
      {error && (
        <view className='Toast'>
          <text className='Toast__text'>{error}</text>
        </view>
      )}
      <ScreenComponent />
    </view>
  )
}

export function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
