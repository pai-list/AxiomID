
/**
 * @jest-environment node
 */


jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((cb) => cb),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    userAgent: {
      count: jest.fn(),
    },
    piPayment: {
      count: jest.fn(),
    },
  },
}));
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { anonymous: { windowMs: 60000, maxRequests: 30 } },
}));
jest.mock('@/lib/ip', () => ({
  getClientIp: jest.fn(() => '127.0.0.1'),
}));
jest.mock('@/lib/trust', () => ({
  calculateTrustScore: jest.fn(),
}));

import { GET } from '@/app/api/status/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { calculateTrustScore } from '@/lib/trust';
import { unstable_cache } from 'next/cache';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockCalculateTrustScore = calculateTrustScore as jest.Mock;

// `getCachedAverageTrustScore` is created once at module-load time (when the
// route file is first imported above), so `unstable_cache`'s call args must be
// captured here — before any `jest.clearAllMocks()` wipes the mock's call
// history in `beforeEach`.
const unstableCacheCallArgs = (unstable_cache as jest.Mock).mock.calls[0];

function mockGetRequest() {
  return new Request('http://localhost/api/status', { method: 'GET' }) as any;
}

function setupDbMocks({
  userCounts = [0, 0, 0],
  findMany = [] as unknown[],
  agentCounts = [0, 0],
  paymentCount = 0,
  xpSum = 0,
}: {
  userCounts?: [number, number, number];
  findMany?: unknown[];
  agentCounts?: [number, number];
  paymentCount?: number;
  xpSum?: number | null;
} = {}) {
  (mockPrisma.user.count as jest.Mock)
    .mockResolvedValueOnce(userCounts[0])
    .mockResolvedValueOnce(userCounts[1])
    .mockResolvedValueOnce(userCounts[2]);
  (mockPrisma.user.findMany as jest.Mock).mockResolvedValueOnce(findMany);
  (mockPrisma.userAgent.count as jest.Mock)
    .mockResolvedValueOnce(agentCounts[0])
    .mockResolvedValueOnce(agentCounts[1]);
  mockPrisma.piPayment.count.mockResolvedValue(paymentCount);
  (mockPrisma.user.aggregate as jest.Mock).mockResolvedValue({ _sum: { xp: xpSum } });
}

describe('GET /api/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockCalculateTrustScore.mockReturnValue(50);
  });

  it('returns network stats successfully', async () => {
    setupDbMocks({
      userCounts: [1247, 14, 89],
      findMany: [{ xp: 50, _count: { stamps: 1 } }],
      agentCounts: [856, 312],
      paymentCount: 8934,
      xpSum: 456789,
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.network).toBe('axiomid');
    expect(data.version).toBe('1.0.0');
    expect(data.timestamp).toBeDefined();
    expect(data.stats.registeredUsers).toBe(1247);
    expect(data.stats.totalAgents).toBe(856);
    expect(data.stats.activeAgents).toBe(312);
    expect(data.stats.totalPayments).toBe(8934);
    expect(data.stats.totalXpEarned).toBe(456789);
    expect(data.stats.activeUsers).toBe(14);
  });

  it('handles null xpLedger sum gracefully (defaults to 0)', async () => {
    setupDbMocks({ xpSum: null });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.totalXpEarned).toBe(0);
    expect(data.stats.registeredUsers).toBe(0);
    expect(data.stats.activeUsers).toBe(1); // defaults to Math.max(1, 0)
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMITED');
  });

  it('returns 500 on database error', async () => {
    mockPrisma.user.count.mockRejectedValue(new Error('DB connection failed'));

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('uses anonymous rate limit key (not authenticated)', async () => {
    setupDbMocks({ userCounts: [10, 1, 2], agentCounts: [5, 2], xpSum: 100 });

    const req = mockGetRequest();
    await GET(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('status:'),
      expect.anything()
    );
  });

  it('timestamp is a valid ISO date string', async () => {
    setupDbMocks({ userCounts: [5, 1, 1], agentCounts: [3, 1], paymentCount: 2, xpSum: 500 });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  describe('averageTrustScore (getCachedAverageTrustScore)', () => {
    it('wraps the trust score computation with unstable_cache using a 5-minute revalidate window', () => {
      expect(unstableCacheCallArgs).toBeDefined();
      expect(typeof unstableCacheCallArgs[0]).toBe('function');
      expect(unstableCacheCallArgs[1]).toEqual(['status-average-trust-score']);
      expect(unstableCacheCallArgs[2]).toEqual({ revalidate: 300 });
    });

    it('queries only xp and the stamps count (not the full stamps relation)', async () => {
      setupDbMocks({ findMany: [] });

      await GET(mockGetRequest());

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: 100,
        select: {
          xp: true,
          _count: {
            select: { stamps: true },
          },
        },
      });
    });

    it('computes the average trust score across the sampled users', async () => {
      setupDbMocks({
        findMany: [
          { xp: 100, _count: { stamps: 5 } },
          { xp: 1000, _count: { stamps: 10 } },
        ],
      });
      mockCalculateTrustScore
        .mockReturnValueOnce(22)
        .mockReturnValueOnce(100);

      const res = await GET(mockGetRequest());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.stats.averageTrustScore).toBe(61); // (22 + 100) / 2 = 61
    });

    it('calls calculateTrustScore with xp and the stamps count from the _count aggregation', async () => {
      setupDbMocks({
        findMany: [
          { xp: 42, _count: { stamps: 3 } },
          { xp: 7, _count: { stamps: 0 } },
        ],
      });

      await GET(mockGetRequest());

      expect(mockCalculateTrustScore).toHaveBeenCalledTimes(2);
      expect(mockCalculateTrustScore).toHaveBeenCalledWith(42, 3);
      expect(mockCalculateTrustScore).toHaveBeenCalledWith(7, 0);
    });

    it('rounds a fractional average to the nearest integer', async () => {
      setupDbMocks({
        findMany: [
          { xp: 1, _count: { stamps: 1 } },
          { xp: 2, _count: { stamps: 2 } },
        ],
      });
      mockCalculateTrustScore
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4);

      const res = await GET(mockGetRequest());
      const data = await res.json();

      expect(data.stats.averageTrustScore).toBe(4); // (3 + 4) / 2 = 3.5 -> rounds to 4
    });

    it('returns an average trust score of exactly the single sampled score', async () => {
      setupDbMocks({ findMany: [{ xp: 500, _count: { stamps: 3 } }] });
      mockCalculateTrustScore.mockReturnValueOnce(44);

      const res = await GET(mockGetRequest());
      const data = await res.json();

      expect(data.stats.averageTrustScore).toBe(44);
    });

    it('returns 0 average trust score when no users are found', async () => {
      setupDbMocks({ findMany: [] });

      const res = await GET(mockGetRequest());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.stats.averageTrustScore).toBe(0);
      expect(mockCalculateTrustScore).not.toHaveBeenCalled();
    });

    it('returns 500 INTERNAL_ERROR when the trust score sample query fails', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.userAgent.count as jest.Mock).mockResolvedValue(0);
      mockPrisma.piPayment.count.mockResolvedValue(0);
      (mockPrisma.user.aggregate as jest.Mock).mockResolvedValue({ _sum: { xp: 0 } });
      (mockPrisma.user.findMany as jest.Mock).mockRejectedValueOnce(new Error('sample query failed'));

      const res = await GET(mockGetRequest());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  it('includes a verificationRate stat alongside the cached averageTrustScore', async () => {
    setupDbMocks({ userCounts: [200, 20, 50], agentCounts: [1, 1], xpSum: 10 });

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(data.stats.verificationRate).toBe(25); // 50/200 * 100
    expect(data.stats).toHaveProperty('averageTrustScore');
  });
});