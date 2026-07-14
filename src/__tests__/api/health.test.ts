
/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { anonymous: { windowMs: 60000, maxRequests: 30 } },
}));
jest.mock('@/lib/ip', () => ({
  getClientIp: jest.fn(() => '127.0.0.1'),
}));
jest.mock('@/lib/errors', () => {
  const actual = jest.requireActual('@/lib/errors');
  return {
    ...actual,
    apiSuccess: jest.fn(actual.apiSuccess),
  };
});

import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { apiSuccess } from '@/lib/errors';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockApiSuccess = apiSuccess as jest.Mock;

function mockGetRequest() {
  return new Request('http://localhost/api/health', { method: 'GET' }) as any;
}

describe('GET /api/health', () => {
  const originalCloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
  });

  afterEach(() => {
    if (originalCloudflareAccountId === undefined) {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
    } else {
      process.env.CLOUDFLARE_ACCOUNT_ID = originalCloudflareAccountId;
    }
  });

  it('returns healthy status with 200 when all services are online', async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.uptime).toBe(100);
    expect(Array.isArray(data.services)).toBe(true);
    expect(data.services).toHaveLength(4);
    expect(data.services.every((s: { status: string }) => s.status === 'ONLINE')).toBe(true);
  });

  it('includes a service entry for each dependency with name, status, and latencyMs', async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    const names = data.services.map((s: { name: string }) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(['Database', 'Stellar Network', 'Pi Network', 'Workers AI'])
    );
    for (const service of data.services) {
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('status');
      expect(service).toHaveProperty('latencyMs');
      expect(typeof service.latencyMs).toBe('number');
      expect(service.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns a valid ISO timestamp string', async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('returns degraded status (not offline) when the database check fails', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('degraded');
    const dbService = data.services.find((s: { name: string }) => s.name === 'Database');
    expect(dbService.status).toBe('OFFLINE');
  });

  it('returns degraded status when an external service (Stellar) is offline', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('horizon.stellar.org')) {
        throw new Error('network error');
      }
      return { ok: true, status: 200 };
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('degraded');
    const stellarService = data.services.find((s: { name: string }) => s.name === 'Stellar Network');
    expect(stellarService.status).toBe('OFFLINE');
  });

  it('returns degraded status (not treated as offline overall) when a service responds with a non-ok status', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('horizon.stellar.org')) {
        return { ok: false, status: 503 };
      }
      return { ok: true, status: 200 };
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('degraded');
    const stellarService = data.services.find((s: { name: string }) => s.name === 'Stellar Network');
    expect(stellarService.status).toBe('DEGRADED');
  });

  it('treats Pi Network 404 responses as ONLINE', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('api.minepi.com')) {
        return { ok: false, status: 404 };
      }
      return { ok: true, status: 200 };
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    const piService = data.services.find((s: { name: string }) => s.name === 'Pi Network');
    expect(piService.status).toBe('ONLINE');
  });

  it('reports Workers AI as ONLINE with zero latency when no Cloudflare account id is configured', async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    const workersAiService = data.services.find((s: { name: string }) => s.name === 'Workers AI');
    expect(workersAiService.status).toBe('ONLINE');
    expect(workersAiService.latencyMs).toBe(0);
  });

  it('checks the Cloudflare Workers AI endpoint when an account id is configured', async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id';

    const req = mockGetRequest();
    await GET(req);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('test-account-id'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns "degraded" (never a distinct "offline" value) even when one service is fully OFFLINE and another only DEGRADED', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB connection failed'));
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('horizon.stellar.org')) {
        return { ok: false, status: 503 };
      }
      return { ok: true, status: 200 };
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.status).toBe('degraded');
    const dbService = data.services.find((s: { name: string }) => s.name === 'Database');
    const stellarService = data.services.find((s: { name: string }) => s.name === 'Stellar Network');
    expect(dbService.status).toBe('OFFLINE');
    expect(stellarService.status).toBe('DEGRADED');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMITED');
  });

  it('uses an anonymous, IP-scoped rate limit key', async () => {
    const req = mockGetRequest();
    await GET(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('health:'),
      expect.anything()
    );
  });

  it('returns 500 with INTERNAL_ERROR when building the response payload fails unexpectedly', async () => {
    mockApiSuccess.mockImplementationOnce(() => {
      throw new Error('unexpected serialization failure');
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});