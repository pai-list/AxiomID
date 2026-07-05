/**
 * @jest-environment node
 *
 * Tests for src/app/api/agents/route.ts (new in this PR)
 * Covers: GET /api/agents
 */

import { apiError } from '@/lib/errors';

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userAgent: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { authenticated: { windowMs: 60000, maxRequests: 100 } },
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { GET } from '@/app/api/agents/route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limiter';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;

function mockGetRequest() {
  return new Request('http://localhost/api/agents', { method: 'GET' }) as any;
}

const mockUser = {
  id: 'user-1',
  walletAddress: 'pi:testuser',
  piUid: 'pi-uid-1',
  piUsername: 'testuser',
  xp: 0,
  tier: 'Beginner',
};

describe('GET /api/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it('returns 401 when authentication fails', async () => {
    mockRequireAuth.mockResolvedValue({ error: apiError('UNAUTHORIZED', 'Unauthorized'), user: null });

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('does not query the database when auth fails', async () => {
    mockRequireAuth.mockResolvedValue({ error: apiError('UNAUTHORIZED', 'Unauthorized'), user: null });

    await GET(mockGetRequest());

    expect(mockPrisma.userAgent.findMany).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMITED');
  });

  it('scopes the rate limit key to the authenticated user id', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue([]);

    await GET(mockGetRequest());

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      `agents-list:${mockUser.id}`,
      expect.anything()
    );
  });

  it('returns 200 with the list of agents for the authenticated user', async () => {
    const agents = [
      {
        id: 'agent-1',
        publicId: 'pub-agent-1',
        name: 'My Agent',
        description: 'A test agent',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-01'),
      },
    ];
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue(agents);

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.agents).toHaveLength(1);
    expect(data.agents[0].id).toBe('agent-1');
    expect(data.agents[0].name).toBe('My Agent');
  });

  it('returns an empty array when the user has no agents', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.agents).toEqual([]);
  });

  it('queries only agents belonging to the authenticated user', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue([]);

    await GET(mockGetRequest());

    expect(mockPrisma.userAgent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockUser.id },
      })
    );
  });

  it('orders agents by createdAt descending', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue([]);

    await GET(mockGetRequest());

    expect(mockPrisma.userAgent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('selects only the expected agent fields', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockResolvedValue([]);

    await GET(mockGetRequest());

    expect(mockPrisma.userAgent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          publicId: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  });

  it('returns 500 INTERNAL_ERROR on database failure', async () => {
    (mockPrisma.userAgent.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await GET(mockGetRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
    expect(data.error).toContain('Failed to fetch agents');
  });
});