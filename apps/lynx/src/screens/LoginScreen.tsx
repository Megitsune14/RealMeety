import { useState, useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { login, fetchMe } from '../services/api.js'
import { AuthNative } from '../native/modules.js'

export function LoginScreen() {
  const { navigate, setUser, setError, error } = useApp()
  const [email, setEmail] = useState('demo@realmeety.app')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)

  const submit = useCallback(async () => {
    'background only'
    setLoading(true)
    setError(null)
    try {
      const data = await login(email, password)
      await AuthNative.saveTokens(data.accessToken, data.refreshToken)
      const user = await fetchMe()
      setUser(user)
      if (!user.age) navigate('age')
      else if (!user.orientation) navigate('orientation')
      else if (user.kycStatus !== 'verified') navigate('kyc')
      else navigate('map')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }, [email, password, navigate, setUser, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Connexion</text>
      <view className='Field' bindtap={() => setEmail('demo@realmeety.app')}>
        <text className='Field__value'>{email}</text>
      </view>
      <view className='Field' bindtap={() => setPassword('password123')}>
        <text className='Field__value'>•••••••••••</text>
      </view>
      {error && <text className='Error'>{error}</text>}
      <view className='Button Button--primary' bindtap={submit}>
        <text className='Button__text'>{loading ? 'Chargement…' : 'Se connecter'}</text>
      </view>
    </scroll-view>
  )
}
