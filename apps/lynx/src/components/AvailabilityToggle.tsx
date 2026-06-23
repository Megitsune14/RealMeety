interface AvailabilityToggleProps {
  isAvailable: boolean
  disabled?: boolean
  onToggle: () => void
}

export function AvailabilityToggle({ isAvailable, disabled, onToggle }: AvailabilityToggleProps) {
  return (
    <view
      className={`AvailabilityToggle ${isAvailable ? 'AvailabilityToggle--on' : ''}`}
      bindtap={onToggle}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <text className='AvailabilityToggle__label'>
        {isAvailable ? 'Disponible' : 'Indisponible'}
      </text>
      <text className='AvailabilityToggle__sub'>
        {isAvailable ? 'Votre position est partagée' : 'Activez pour apparaître sur la carte'}
      </text>
    </view>
  )
}
