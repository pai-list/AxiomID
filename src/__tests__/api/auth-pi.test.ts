/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { piAuth: { windowMs: 60000, maxRequests: 5 } },
}));

import { POST } from '@/app/api/auth/pi/route';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/auth/pi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/auth/pi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates new user on valid Pi auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-uid-123' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      walletAddress: '0xpi-uid-123000000000000000000000000000000',
      piUid: 'pi-uid-123',
      piUsername: 'testuser',
      xp: 0,
      tier: 'Visitor',
      did: null,
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const req = mockRequest({
      accessToken: 'valid-token',
      uid: 'pi-uid-123',
      username: 'testuser',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.tier).toBe('Visitor');
  });

  it('updates existing user on return visit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'existing-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      piUid: 'existing-uid',
    } as any);
    mockPrisma.user.update.mockResolvedValue({
      id: 'existing-user',
      walletAddress: '0x' + '0'.repeat(40),
      piUid: 'existing-uid',
      piUsername: 'updated',
      xp: 100,
      tier: 'Citizen',
      did: 'did:axiom:test',
      kycStatus: 'VERIFIED',
      agent: { name: 'My Agent' },
    } as any);

    const req = mockRequest({
      accessToken: 'new-token',
      uid: 'existing-uid',
      username: 'updated',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBe('existing-user');
    expect(data.tier).toBe('Citizen');
  });

  it('returns 401 on invalid Pi token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const req = mockRequest({
      accessToken: 'bad-token',
      uid: 'uid',
      username: 'user',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('PI_AUTH_FAILED');
  });

  it('returns 400 on invalid body', async () => {
    const req = mockRequest({});

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 on UID mismatch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'different-uid' }),
    });

    const req = mockRequest({
      accessToken: 'token',
      uid: 'wrong-uid',
      username: 'user',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('PI_AUTH_FAILED');
  });

  // ----------------------------------------------------------------
  // DID generation (added in this PR)
  // ----------------------------------------------------------------
  it('includes did and didMethod in user.create payload for new user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'new-pi-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user',
      walletAddress: 'pi:new-pi-uid',
      piUid: 'new-pi-uid',
      piUsername: 'newuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi-new-pi-uid',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const req = mockRequest({ accessToken: 'token', uid: 'new-pi-uid', username: 'newuser' });
    await POST(req);

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          did: expect.stringMatching(/^did:axiom:axiomid\.app:/),
          didMethod: 'did:axiom',
        }),
      }),
    );
  });

  it('includes did and didMethod in user.update payload for existing user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'existing-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      piUid: 'existing-uid',
    } as any);
    mockPrisma.user.update.mockResolvedValue({
      id: 'existing-user',
      walletAddress: 'pi:existing-uid',
      piUid: 'existing-uid',
      piUsername: 'existinguser',
      xp: 50,
      tier: 'Citizen',
      did: 'did:axiom:axiomid.app:pi-existing-uid',
      didMethod: 'did:axiom',
      kycStatus: 'VERIFIED',
      agent: null,
    } as any);

    const req = mockRequest({ accessToken: 'token', uid: 'existing-uid', username: 'existinguser' });
    await POST(req);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          did: expect.stringMatching(/^did:axiom:axiomid\.app:/),
          didMethod: 'did:axiom',
        }),
      }),
    );
  });

  it('derives did from clientWalletAddress when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'uid-xyz' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-xyz',
      walletAddress: 'GSTELLARADDRESS',
      piUid: 'uid-xyz',
      piUsername: 'stellaruser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:gstellaraddress',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const req = mockRequest({
      accessToken: 'token',
      uid: 'uid-xyz',
      username: 'stellaruser',
      walletAddress: 'GSTELLARADDRESS',
    });
    await POST(req);

    // DID should be derived from the provided walletAddress, not pi:uid
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          did: 'did:axiom:axiomid.app:gstellaraddress',
        }),
      }),
    );
  });

  it('returns did in the API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'response-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'resp-user',
      walletAddress: 'pi:response-uid',
      piUid: 'response-uid',
      piUsername: 'respuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi-response-uid',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const req = mockRequest({ accessToken: 'token', uid: 'response-uid', username: 'respuser' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.did).toBe('did:axiom:axiomid.app:pi-response-uid');
  });
});

// -----------------------------------------------------------------------
// PR refactor: route now uses prisma.user.upsert (not findUnique + create/update)
// These tests correctly verify the upsert-based implementation.
// -----------------------------------------------------------------------
describe('POST /api/auth/pi — upsert-based DID generation (PR refactor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // The PR changed the route to use upsert. Add the mock here so assertions work.
    (mockPrisma.user as any).upsert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls upsert with did and didMethod for a new pi: wallet', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'upsert-uid' }),
    });

    (mockPrisma.user as any).upsert.mockResolvedValue({
      id: 'upsert-user',
      walletAddress: 'pi:upsert-uid',
      piUid: 'upsert-uid',
      piUsername: 'upsertuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi-upsert-uid',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    });

    const req = mockRequest({ accessToken: 'token', uid: 'upsert-uid', username: 'upsertuser' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect((mockPrisma.user as any).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { piUid: 'upsert-uid' },
        create: expect.objectContaining({
          did: 'did:axiom:axiomid.app:pi-upsert-uid',
          didMethod: 'did:axiom',
        }),
        update: expect.objectContaining({
          did: 'did:axiom:axiomid.app:pi-upsert-uid',
          didMethod: 'did:axiom',
        }),
      }),
    );
    expect(data.did).toBe('did:axiom:axiomid.app:pi-upsert-uid');
  });

  it('derives walletAddress from pi:uid when clientWalletAddress is not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'derived-uid' }),
    });

    (mockPrisma.user as any).upsert.mockResolvedValue({
      id: 'derived-user',
      walletAddress: 'pi:derived-uid',
      piUid: 'derived-uid',
      piUsername: 'deriveduser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi-derived-uid',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    });

    const req = mockRequest({ accessToken: 'token', uid: 'derived-uid', username: 'deriveduser' });
    await POST(req);

    expect((mockPrisma.user as any).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          walletAddress: 'pi:derived-uid',
        }),
      }),
    );
  });

  it('uses clientWalletAddress for DID when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'custom-uid' }),
    });

    (mockPrisma.user as any).upsert.mockResolvedValue({
      id: 'custom-user',
      walletAddress: 'GCUSTOM',
      piUid: 'custom-uid',
      piUsername: 'customuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:gcustom',
      didMethod: 'did:axiom',
      kycStatus: 'NONE',
      agent: null,
    });

    const req = mockRequest({
      accessToken: 'token',
      uid: 'custom-uid',
      username: 'customuser',
      walletAddress: 'GCUSTOM',
    });
    await POST(req);

    expect((mockPrisma.user as any).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          walletAddress: 'GCUSTOM',
          did: 'did:axiom:axiomid.app:gcustom',
        }),
      }),
    );
  });

  it('returns 500 when upsert throws', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'err-uid' }),
    });

    (mockPrisma.user as any).upsert.mockRejectedValue(new Error('upsert failed'));

    const req = mockRequest({ accessToken: 'token', uid: 'err-uid', username: 'erruser' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});
