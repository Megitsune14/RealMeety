import { useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { recordConsents } from '../services/api.js'
import { LEGAL_VERSIONS } from '../config.js'

export function ConsentScreen() {
  const { navigate, setError } = useApp()

  const accept = useCallback(async () => {
    'background only'
    setError(null)
    try {
      await recordConsents([
        { type: 'terms', version: LEGAL_VERSIONS.terms },
        { type: 'privacy', version: LEGAL_VERSIONS.privacy },
        { type: 'location', version: LEGAL_VERSIONS.location },
        { type: 'kyc', version: LEGAL_VERSIONS.kyc },
      ])
      navigate('location-permission')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }, [navigate, setError])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Consentements</text>
      <text className='LegalText'>
        En continuant, vous acceptez nos CGU, notre politique de confidentialité (RGPD/CNIL),
        le traitement de votre localisation uniquement lorsque vous êtes disponible,
        et la vérification d'identité requise par la réglementation.
      </text>
      <view className='Button Button--ghost' bindtap={() => navigate('legal')}>
        <text className='Button__text'>Lire les documents légaux</text>
      </view>
      <view className='Button Button--primary' bindtap={accept}>
        <text className='Button__text'>J'accepte et continue</text>
      </view>
    </scroll-view>
  )
}
