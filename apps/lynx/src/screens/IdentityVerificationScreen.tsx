import { useCallback, useState } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { startKyc, completeMockKyc, getKycStatus, getCurrentUser } from '../services/api.js'

export function IdentityVerificationScreen() {
  const { navigate, setError } = useApp()
  const [loading, setLoading] = useState(false)

  const start = useCallback(async () => {
    'background only'
    setLoading(true)
    setError(null)
    try {
      const session = await startKyc()
      if (session.mock) {
        navigate('kyc-pending')
      } else {
        navigate('kyc-pending')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur KYC')
    } finally {
      setLoading(false)
    }
  }, [navigate, setError])

  return (
    <view className='Screen'>
      <text className='Screen__title'>Vérification d'identité</text>
      <text className='Screen__subtitle'>
        Obligation légale pour garantir la majorité et la sécurité des utilisateurs.
        Aucune photo de profil n'est conservée dans l'application.
      </text>
      <view className='Button Button--primary' bindtap={start}>
        <text className='Button__text'>{loading ? 'Préparation…' : 'Commencer la vérification'}</text>
      </view>
    </view>
  )
}

export function VerificationPendingScreen() {
  const { navigate, setUser, setError } = useApp()
  const [checking, setChecking] = useState(false)

  const checkStatus = useCallback(async () => {
    'background only'
    setChecking(true)
    try {
      const { kycStatus } = await getKycStatus()
      if (kycStatus === 'verified') {
        const { fetchMe } = await import('../services/api.js')
        const user = await fetchMe()
        setUser(user)
        navigate('map')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setChecking(false)
    }
  }, [navigate, setUser, setError])

  const mockComplete = useCallback(async () => {
    'background only'
    const user = getCurrentUser()
    if (user) {
      await completeMockKyc(user.id)
      await checkStatus()
    }
  }, [checkStatus])

  return (
    <view className='Screen'>
      <text className='Screen__title'>Vérification en cours</text>
      <text className='Screen__subtitle'>
        Votre identité est en cours de validation. Cela peut prendre quelques minutes.
      </text>
      <view className='Button Button--primary' bindtap={checkStatus}>
        <text className='Button__text'>{checking ? 'Vérification…' : 'Actualiser le statut'}</text>
      </view>
      <view className='Button Button--ghost' bindtap={mockComplete}>
        <text className='Button__text'>Simuler KYC validé (dev)</text>
      </view>
    </view>
  )
}
