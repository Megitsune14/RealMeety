import { useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { deleteAccount, exportAccountData } from '../services/api.js'
import { AuthNative } from '../native/modules.js'

export function SettingsScreen() {
  const { navigate, setUser, setError } = useApp()

  const exportData = useCallback(async () => {
    'background only'
    try {
      const data = await exportAccountData()
      console.info('Export données:', JSON.stringify(data))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur export')
    }
  }, [setError])

  const removeAccount = useCallback(async () => {
    'background only'
    try {
      await deleteAccount()
      await AuthNative.clearTokens()
      setUser(null)
      navigate('welcome')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression')
    }
  }, [navigate, setUser, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Paramètres</text>
      <view className='ListItem' bindtap={() => navigate('legal')}>
        <text className='ListItem__text'>CGU & Confidentialité</text>
      </view>
      <view className='ListItem' bindtap={exportData}>
        <text className='ListItem__text'>Exporter mes données (RGPD)</text>
      </view>
      <view className='ListItem ListItem--danger' bindtap={removeAccount}>
        <text className='ListItem__text'>Supprimer mon compte</text>
      </view>
      <view className='Button Button--ghost' bindtap={() => navigate('map')}>
        <text className='Button__text'>Retour à la carte</text>
      </view>
    </scroll-view>
  )
}
