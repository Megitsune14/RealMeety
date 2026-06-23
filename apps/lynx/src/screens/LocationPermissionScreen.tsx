import { useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { LocationNative } from '../native/modules.js'

export function LocationPermissionScreen() {
  const { navigate, setLocation, setError } = useApp()

  const grant = useCallback(async () => {
    'background only'
    const ok = await LocationNative.requestPermission()
    if (!ok) {
      setError('Permission de localisation refusée')
      return
    }
    const pos = await LocationNative.getCurrentPosition()
    setLocation(pos.lat, pos.lng)
    navigate('kyc')
  }, [navigate, setLocation, setError])

  return (
    <view className='Screen'>
      <text className='Screen__title'>Localisation</text>
      <text className='Screen__subtitle'>
        Votre position n'est partagée que lorsque vous activez « Disponible ».
        Aucune conservation inutile des données de localisation.
      </text>
      <view className='Button Button--primary' bindtap={grant}>
        <text className='Button__text'>Autoriser la localisation</text>
      </view>
    </view>
  )
}
