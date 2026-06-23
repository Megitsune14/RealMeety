import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isAdult, computeAge, toAgeBucket, SUBSCRIPTION_LIMITS } from '@realmeety/shared'

describe('shared utilities', () => {
  it('rejects minors', () => {
    const dob = `${new Date().getFullYear() - 17}-01-01`
    assert.equal(isAdult(dob), false)
  })

  it('accepts adults', () => {
    const dob = `${new Date().getFullYear() - 25}-06-15`
    assert.equal(isAdult(dob), true)
    assert.equal(computeAge(dob), 25)
  })

  it('creates age buckets', () => {
    assert.equal(toAgeBucket(23), '20-24')
    assert.equal(toAgeBucket(30), '30-34')
  })

  it('defines subscription limits', () => {
    assert.equal(SUBSCRIPTION_LIMITS.free.radiusMeters, 500)
    assert.equal(SUBSCRIPTION_LIMITS.premium.radiusMeters, 2000)
  })
})
