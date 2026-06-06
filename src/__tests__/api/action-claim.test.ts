/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    action: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    xpLedger: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { authenticated: { windowMs: 60000, maxRequests: 100 } },
}));

import { POST } from '@/app/api/action/claim/route';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/action/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/action/claim', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('claims XP for valid action', async () => {
    mockPrisma.action.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', xp: 0 } as any);
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        action: { create: jest.fn().mockResolvedValue({ id: 'action-1', type: 'connect_twitter', userId: 'u', xp: 50, metadata: null, timestamp: new Date() }) },
        xpLedger: { create: jest.fn().mockResolvedValue({ id: 'ledger-1' }) },
        user: { update: jest.fn().mockResolvedValue({ id: 'user-1', xp: 50, tier: 'Visitor' }) },
      };
      return fn(tx);
    });

    const req = mockRequest({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'connect_twitter',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.xpEarned).toBe(50);
    expect(data.tier).toBe('Visitor');
  });

  it('returns 409 on duplicate claim', async () => {
    mockPrisma.action.findUnique.mockResolvedValue({ id: 'existing-action' } as any);

    const req = mockRequest({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'connect_twitter',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('CONFLICT');
  });

  it('returns 400 on unknown action type', async () => {
    mockPrisma.action.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', xp: 0 } as any);

    const req = mockRequest({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'nonexistent_action',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 if user not found', async () => {
    mockPrisma.action.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = mockRequest({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'connect_twitter',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe('NOT_FOUND');
  });

  it('upgrades tier when XP threshold crossed', async () => {
    mockPrisma.action.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', xp: 90 } as any);
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        action: { create: jest.fn().mockResolvedValue({ id: 'action-2', type: 'daily_pow', userId: 'u', xp: 20, metadata: null, timestamp: new Date() }) },
        xpLedger: { create: jest.fn().mockResolvedValue({ id: 'ledger-2' }) },
        user: { update: jest.fn().mockResolvedValue({ id: 'user-1', xp: 110, tier: 'Citizen' }) },
      };
      return fn(tx);
    });

    const req = mockRequest({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'daily_pow',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tier).toBe('Citizen');
    expect(data.newBalance).toBe(110);
  });
});
