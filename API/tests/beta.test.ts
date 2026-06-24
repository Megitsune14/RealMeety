import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isInsideBetaZone, distanceMeters } from '../src/services/beta.js';
import { resetEnvCache } from '../src/config/env.js';

describe('beta zone', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-min-16-chars' };
    resetEnvCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvCache();
  });

  it('allows all locations when beta mode off', () => {
    process.env.BETA_MODE = 'false';
    expect(isInsideBetaZone(40.0, 2.0)).toBe(true);
  });

  it('restricts locations outside beta radius', () => {
    process.env.BETA_MODE = 'true';
    process.env.BETA_CENTER_LAT = '48.8566';
    process.env.BETA_CENTER_LNG = '2.3522';
    process.env.BETA_RADIUS_METERS = '1000';
    expect(isInsideBetaZone(48.8566, 2.3522)).toBe(true);
    expect(isInsideBetaZone(43.0, 2.0)).toBe(false);
  });

  it('computes distance correctly', () => {
    const d = distanceMeters(48.8566, 2.3522, 48.8570, 2.3530);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(200);
  });
});
