/**
 * rate-limiter.test.ts
 *
 * Since the new rate-limiter uses @upstash/redis, we mock the module and the
 * Redis client so tests run offline without any real network calls.
 *
 * Strategy:
 *  - Mock @upstash/redis to expose a controllable `eval` spy.
 *  - Set env vars to make getRedis() return the mock client.
 *  - Test the public contract (allowed / remaining / resetAt).
 */

const evalMock = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    eval: evalMock,
  })),
}));

import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

// Simulate a running counter per key across calls
function makeCounter(initial = 0) {
  let count = initial;
  return () => ++count;
}

describe('checkRateLimit (Redis-backed)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-token',
    };
    evalMock.mockReset();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('allows first request (count = 1, maxRequests = 5)', async () => {
    evalMock.mockResolvedValueOnce(1); // first INCR → 1
    const result = await checkRateLimit('rl-a1', { windowMs: 60_000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining correctly (count = 2, maxRequests = 3)', async () => {
    evalMock.mockResolvedValueOnce(2);
    const result = await checkRateLimit('rl-b1', { windowMs: 60_000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('allows last allowed request (count = maxRequests)', async () => {
    evalMock.mockResolvedValueOnce(3);
    const result = await checkRateLimit('rl-b2', { windowMs: 60_000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks when count exceeds maxRequests', async () => {
    evalMock.mockResolvedValueOnce(3); // count = maxRequests + 1 = 3 for max=2
    const result = await checkRateLimit('rl-c1', { windowMs: 60_000, maxRequests: 2 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns correct resetAt (approx now + windowMs)', async () => {
    evalMock.mockResolvedValueOnce(1);
    const before = Date.now();
    const result = await checkRateLimit('rl-f1', { windowMs: 30_000, maxRequests: 5 });
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 30_000);
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 31_000);
  });

  it('falls back to allow-all when env vars are absent', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    // Must re-import the module with cleared module registry so the singleton is rebuilt.
    jest.resetModules();
    // Re-mock after reset
    jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));
    const { checkRateLimit: rl } = await import('@/lib/rate-limiter');

    const result = await rl('rl-g1', { windowMs: 60_000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(evalMock).not.toHaveBeenCalled();
  });

  it('RATE_LIMITS constants are correct', () => {
    expect(RATE_LIMITS.anonymous.maxRequests).toBe(30);
    expect(RATE_LIMITS.authenticated.maxRequests).toBe(100);
    expect(RATE_LIMITS.piAuth.maxRequests).toBe(5);
    expect(RATE_LIMITS.payment.maxRequests).toBe(10);
  });
});
