import { useCallback } from '@lynx-js/react'
import { useApp } from '../context/AppContext.js'

export function WelcomeScreen() {
  const { navigate } = useApp()

  const goRegister = useCallback(() => {
    'background only'
    navigate('register')
  }, [navigate])

  const goLogin = useCallback(() => {
    'background only'
    navigate('login')
  }, [navigate])

  return (
    <view className='Screen Screen--welcome'>
      <text className='Brand'>RealMeety</text>
      <text className='Tagline'>Rencontres réelles. Zéro profil. Zéro swipe.</text>
      <text className='Description'>
        Découvrez qui est disponible à proximité et rencontrez-vous dans le monde réel.
      </text>
      <view className='Button Button--primary' bindtap={goRegister}>
        <text className='Button__text'>Créer un compte</text>
      </view>
      <view className='Button Button--ghost' bindtap={goLogin}>
        <text className='Button__text'>Se connecter</text>
      </view>
    </view>
  )
}
