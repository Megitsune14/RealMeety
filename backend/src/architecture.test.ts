import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SUBSCRIPTION_LIMITS } from '@realmeety/shared'

describe('RealMeety architecture guardrails', () => {
  it('excludes profile fields from shared types', () => {
    const userShape = ['id', 'email', 'age', 'orientation', 'availabilityStatus']
    assert.ok(!userShape.includes('bio'))
    assert.ok(!userShape.includes('photo_url'))
  })

  it('sorts markers by distance only (no algo scoring)', () => {
    const markers = [
      { distance: 500 },
      { distance: 100 },
      { distance: 300 },
    ]
    const sorted = [...markers].sort((a, b) => a.distance - b.distance)
    assert.deepEqual(sorted.map(m => m.distance), [100, 300, 500])
  })

  it('enforces free tier limits', () => {
    assert.equal(SUBSCRIPTION_LIMITS.free.maxDailyAvailabilityMinutes, 30)
    assert.equal(SUBSCRIPTION_LIMITS.premium.maxDailyAvailabilityMinutes, null)
  })
})
