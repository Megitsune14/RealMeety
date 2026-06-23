import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { obfuscateCoordinates, haversineDistanceMeters } from './utils/geo.js'

describe('geo utilities', () => {
  it('obfuscates coordinates within expected range', () => {
    const { lat, lng } = obfuscateCoordinates(48.8566, 2.3522, 75)
    assert.ok(Math.abs(lat - 48.8566) < 0.002)
    assert.ok(Math.abs(lng - 2.3522) < 0.002)
  })

  it('computes haversine distance', () => {
    const d = haversineDistanceMeters(48.8566, 2.3522, 48.8606, 2.3376)
    assert.ok(d > 1000 && d < 2000)
  })
})
