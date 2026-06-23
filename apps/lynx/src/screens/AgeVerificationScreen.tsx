import { useState, useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { verifyAge } from '../services/api.js'

export function AgeVerificationScreen() {
  const { navigate, setError, error } = useApp()
  const [dob, setDob] = useState('1998-01-15')
  const [loading, setLoading] = useState(false)

  const submit = useCallback(async () => {
    'background only'
    setLoading(true)
    setError(null)
    try {
      await verifyAge(dob)
      navigate('orientation')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vous devez avoir 18 ans ou plus')
    } finally {
      setLoading(false)
    }
  }, [dob, navigate, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Vérification d'âge</text>
      <text className='Screen__subtitle'>Vous devez avoir 18 ans ou plus pour utiliser RealMeety.</text>
      <view className='Field' bindtap={() => setDob('1998-01-15')}>
        <text className='Field__value'>Date : {dob}</text>
      </view>
      {error && <text className='Error'>{error}</text>}
      <view className='Button Button--primary' bindtap={submit}>
        <text className='Button__text'>{loading ? 'Vérification…' : 'Confirmer'}</text>
      </view>
    </scroll-view>
  )
}
