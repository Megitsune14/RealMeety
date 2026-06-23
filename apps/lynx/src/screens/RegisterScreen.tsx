import { useState, useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { register } from '../services/api.js'
import { AuthNative } from '../native/modules.js'

export function RegisterScreen() {
  const { navigate, setError, error } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = useCallback(async () => {
    'background only'
    if (!email || password.length < 8) {
      setError('Email valide et mot de passe (8 caractères min.) requis')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await register(email, password)
      await AuthNative.saveTokens(data.accessToken, data.refreshToken)
      navigate('age')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inscription')
    } finally {
      setLoading(false)
    }
  }, [email, password, navigate, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Créer un compte</text>
      <text className='Field__label'>Email</text>
      <view className='Field'>
        <text className='Field__placeholder'>{email || 'votre@email.com'}</text>
      </view>
      <text className='Field__hint' bindtap={() => setEmail('demo@realmeety.app')}>Utiliser demo@realmeety.app</text>
      <text className='Field__label'>Mot de passe</text>
      <view className='Field' bindtap={() => setPassword('password123')}>
        <text className='Field__placeholder'>{password ? '••••••••' : '8 caractères minimum'}</text>
      </view>
      {error && <text className='Error'>{error}</text>}
      <view className='Button Button--primary' bindtap={submit}>
        <text className='Button__text'>{loading ? 'Chargement…' : 'Continuer'}</text>
      </view>
    </scroll-view>
  )
}
