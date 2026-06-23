import { useCallback, useState } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'
import { mockUpgradePremium, fetchMe } from '../services/api.js'
import { PaymentNative } from '../native/modules.js'

export function PremiumScreen() {
  const { navigate, setUser, setError } = useApp()
  const [loading, setLoading] = useState(false)

  const purchase = useCallback(async (productId: string) => {
    'background only'
    setLoading(true)
    setError(null)
    try {
      const result = await PaymentNative.purchase(productId)
      if (result.success) {
        await mockUpgradePremium()
        const user = await fetchMe()
        setUser(user)
        navigate('map')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur achat')
    } finally {
      setLoading(false)
    }
  }, [navigate, setUser, setError])

  const restore = useCallback(async () => {
    'background only'
    await PaymentNative.restorePurchases()
    const user = await fetchMe()
    setUser(user)
  }, [setUser])

  return (
    <scroll-view scroll-y className='Screen'>
      <text className='Screen__title'>RealMeety Premium</text>
      <view className='PlanCard'>
        <text className='PlanCard__name'>Gratuit</text>
        <text className='PlanCard__feature'>• Rayon 500 m</text>
        <text className='PlanCard__feature'>• 30 min / jour disponible</text>
      </view>
      <view className='PlanCard PlanCard--premium'>
        <text className='PlanCard__name'>Premium</text>
        <text className='PlanCard__feature'>• Rayon 2 km</text>
        <text className='PlanCard__feature'>• Disponibilité illimitée</text>
        <text className='PlanCard__feature'>• Filtres avancés</text>
      </view>
      <view className='Button Button--primary' bindtap={() => purchase('realmeety_premium_monthly')}>
        <text className='Button__text'>{loading ? '…' : '9,99 €/mois'}</text>
      </view>
      <view className='Button Button--secondary' bindtap={() => purchase('realmeety_premium_yearly')}>
        <text className='Button__text'>79,99 €/an</text>
      </view>
      <view className='Button Button--ghost' bindtap={restore}>
        <text className='Button__text'>Restaurer les achats</text>
      </view>
      <view className='Button Button--ghost' bindtap={() => navigate('map')}>
        <text className='Button__text'>Retour</text>
      </view>
    </scroll-view>
  )
}
