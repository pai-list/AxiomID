/**
 * @jest-environment node
 */

import {
  evaluatePath,
  computeReward,
  buildPathKey,
  PRISTINE_MULTIPLIER,
  REPEATED_MULTIPLIER,
  STALE_MULTIPLIER,
  STALE_THRESHOLD,
} from '@/lib/rewards/pristine-path';

describe('evaluatePath', () => {
  it('returns pristine for 0 uses', () => {
    const result = evaluatePath(0);
    expect(result.multiplier).toBe(PRISTINE_MULTIPLIER);
    expect(result.isPristine).toBe(true);
    expect(result.label).toBe('pristine');
  });

  it('returns pristine for negative uses', () => {
    const result = evaluatePath(-1);
    expect(result.isPristine).toBe(true);
    expect(result.label).toBe('pristine');
  });

  it('returns repeated for 1 use', () => {
    const result = evaluatePath(1);
    expect(result.multiplier).toBe(REPEATED_MULTIPLIER);
    expect(result.isPristine).toBe(false);
    expect(result.label).toBe('repeated');
  });

  it('returns repeated for uses below stale threshold', () => {
    const result = evaluatePath(STALE_THRESHOLD - 1);
    expect(result.multiplier).toBe(REPEATED_MULTIPLIER);
    expect(result.isPristine).toBe(false);
    expect(result.label).toBe('repeated');
  });

  it('returns stale at threshold', () => {
    const result = evaluatePath(STALE_THRESHOLD);
    expect(result.multiplier).toBe(STALE_MULTIPLIER);
    expect(result.isPristine).toBe(false);
    expect(result.label).toBe('stale');
  });

  it('returns stale above threshold', () => {
    const result = evaluatePath(50);
    expect(result.multiplier).toBe(STALE_MULTIPLIER);
    expect(result.isPristine).toBe(false);
    expect(result.label).toBe('stale');
  });
});

describe('computeReward', () => {
  it('doubles base XP on pristine path', () => {
    expect(computeReward(100, 0)).toBe(200);
  });

  it('reduces to 80% on repeated path', () => {
    expect(computeReward(100, 3)).toBe(80);
  });

  it('halves base XP on stale path', () => {
    expect(computeReward(100, 9)).toBe(50);
  });

  it('rounds to nearest integer', () => {
    expect(computeReward(15, 3)).toBe(12);
  });

  it('returns 0 for 0 base XP', () => {
    expect(computeReward(0, 0)).toBe(0);
  });

  it('boundary: Math.round rounds an exact .5 result up (stale multiplier of 0.5)', () => {
    // 1 * 0.5 = 0.5 → rounds up to 1 (Math.round rounds half away from zero for positives)
    expect(computeReward(1, 9)).toBe(1);
    // 3 * 0.5 = 1.5 → rounds up to 2
    expect(computeReward(3, 9)).toBe(2);
  });

  it('regression: negative base XP still applies the multiplier and rounds', () => {
    expect(computeReward(-100, 0)).toBe(-200);
  });
});

describe('buildPathKey', () => {
  it('joins segments with colon', () => {
    expect(buildPathKey('user', 'skill', 'deploy')).toBe('user:skill:deploy');
  });

  it('filters empty segments', () => {
    expect(buildPathKey('user', '', 'deploy')).toBe('user:deploy');
  });

  it('returns empty string for no segments', () => {
    expect(buildPathKey()).toBe('');
  });
});
