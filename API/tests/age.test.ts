import { describe, it, expect } from 'vitest';
import { computeAge, isAdult } from '../src/utils/age.js';

describe('age utils', () => {
  it('computes age correctly', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    expect(computeAge(dob)).toBe(25);
  });

  it('rejects minors', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 17);
    expect(isAdult(dob)).toBe(false);
  });

  it('accepts adults', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 18);
    expect(isAdult(dob)).toBe(true);
  });
});
