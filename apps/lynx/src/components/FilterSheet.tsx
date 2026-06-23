import type { MapFilters, Orientation } from '@realmeety/shared'
import { ORIENTATION_LABELS } from '@realmeety/shared'

interface FilterSheetProps {
  filters: MapFilters
  onChange: (filters: MapFilters) => void
}

const orientations: Orientation[] = ['hetero', 'homo', 'bi', 'pan', 'other', 'prefer_not_to_say']

export function FilterSheet({ filters, onChange }: FilterSheetProps) {
  const toggleOrientation = (o: Orientation) => {
    'background only'
    const next = filters.orientations.includes(o)
      ? filters.orientations.filter(x => x !== o)
      : [...filters.orientations, o]
    onChange({ ...filters, orientations: next })
  }

  return (
    <view className='FilterSheet'>
      <text className='FilterSheet__title'>Filtres</text>
      <text className='FilterSheet__label'>Âge : {filters.ageMin} – {filters.ageMax} ans</text>
      <view className='FilterSheet__row'>
        <view
          className='FilterSheet__chip'
          bindtap={() => onChange({ ...filters, ageMin: 18, ageMax: 25 })}
        >
          <text>18–25</text>
        </view>
        <view
          className='FilterSheet__chip'
          bindtap={() => onChange({ ...filters, ageMin: 26, ageMax: 35 })}
        >
          <text>26–35</text>
        </view>
        <view
          className='FilterSheet__chip'
          bindtap={() => onChange({ ...filters, ageMin: 36, ageMax: 99 })}
        >
          <text>36+</text>
        </view>
      </view>
      <text className='FilterSheet__label'>Orientation</text>
      <view className='FilterSheet__orientations'>
        {orientations.map(o => (
          <view
            key={o}
            className={`FilterSheet__chip ${filters.orientations.includes(o) ? 'FilterSheet__chip--active' : ''}`}
            bindtap={() => toggleOrientation(o)}
          >
            <text>{ORIENTATION_LABELS[o]}</text>
          </view>
        ))}
      </view>
    </view>
  )
}
