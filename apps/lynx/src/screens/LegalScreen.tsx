import { useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'

export function LegalScreen() {
  const { navigate } = useApp()

  const back = useCallback(() => {
    'background only'
    navigate('settings')
  }, [navigate])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>Documents légaux</text>
      <text className='LegalText'>
        CONDITIONS GÉNÉRALES D'UTILISATION — RealMeety v1.0.0{'\n\n'}
        RealMeety est une application de rencontre physique sans profil, sans messagerie et sans algorithme de matching.
        L'utilisation est réservée aux personnes majeures (18+).{'\n\n'}
        POLITIQUE DE CONFIDENTIALITÉ — Conformité RGPD et recommandations CNIL{'\n\n'}
        Données collectées : email, âge, orientation, statut de disponibilité, position géographique (uniquement en mode disponible).
        Données exclues : photos, bio, centres d'intérêt, historique de swipe.{'\n\n'}
        Base légale : consentement et exécution du contrat. Durée de conservation minimale.
        Contact DPO : dpo@realmeety.app{'\n\n'}
        Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données.
      </text>
      <view className='Button Button--ghost' bindtap={back}>
        <text className='Button__text'>Retour</text>
      </view>
    </scroll-view>
  )
}
