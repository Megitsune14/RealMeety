import { useCallback } from '@lynx-js/react'
import type { Orientation } from '@realmeety/shared'
import { ORIENTATION_LABELS } from '@realmeety/shared'
import { useApp } from '../context/AppContext.js'
import { updateProfile } from '../services/api.js'

const options: Orientation[] = ['hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say']

export function OrientationScreen() {
  const { navigate, setUser, setError } = useApp()

  const select = useCallback(async (orientation: Orientation) => {
    'background only'
    setError(null)
    try {
      const user = await updateProfile({ orientation })
      setUser(user)
      navigate('consent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }, [navigate, setUser, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Orientation</text>
      <text className='Screen__subtitle'>Aucune bio, aucune photo — juste cette information pour les filtres.</text>
      {options.map(o => (
        <view key={o} className='ListItem' bindtap={() => select(o)}>
          <text className='ListItem__text'>{ORIENTATION_LABELS[o]}</text>
        </view>
      ))}
    </scroll-view>
  )
}
