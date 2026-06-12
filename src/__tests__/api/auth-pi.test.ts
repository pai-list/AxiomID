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
      walletAddress: 'pi:pi-uid-123',
      piUid: 'pi-uid-123',
      piUsername: 'testuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi:pi-uid-123',
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
    expect(data.did).toBe('did:axiom:axiomid.app:pi:pi-uid-123');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          did: 'did:axiom:axiomid.app:pi:pi-uid-123',
          didMethod: 'did:axiom',
        }),
      }),
    );
  });

  it('updates existing user on return visit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'existing-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      piUid: 'existing-uid',
      did: 'did:axiom:test',
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
    expect(data.did).toBe('did:axiom:test');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ did: expect.any(String) }),
      }),
    );
  });

  it('repairs missing DID for existing Pi users and keeps it stable across repeated logins', async () => {
    const uid = 'stable-uid';
    const did = 'did:axiom:axiomid.app:pi:stable-uid';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'existing-without-did',
        piUid: uid,
        did: null,
      } as any)
      .mockResolvedValueOnce({
        id: 'existing-without-did',
        piUid: uid,
        did,
      } as any);

    mockPrisma.user.update
      .mockResolvedValueOnce({
        id: 'existing-without-did',
        walletAddress: `pi:${uid}`,
        piUid: uid,
        piUsername: 'stable',
        xp: 0,
        tier: 'Visitor',
        did,
        kycStatus: 'NONE',
        agent: null,
      } as any)
      .mockResolvedValueOnce({
        id: 'existing-without-did',
        walletAddress: `pi:${uid}`,
        piUid: uid,
        piUsername: 'stable',
        xp: 0,
        tier: 'Visitor',
        did,
        kycStatus: 'NONE',
        agent: null,
      } as any);

    const firstRes = await POST(mockRequest({
      accessToken: 'first-token',
      uid,
      username: 'stable',
    }));
    const firstData = await firstRes.json();

    const secondRes = await POST(mockRequest({
      accessToken: 'second-token',
      uid,
      username: 'stable',
    }));
    const secondData = await secondRes.json();

    expect(firstRes.status).toBe(200);
    expect(secondRes.status).toBe(200);
    expect(firstData.did).toBe(did);
    expect(secondData.did).toBe(did);
    expect(mockPrisma.user.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ did }),
      }),
    );
    expect(mockPrisma.user.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.not.objectContaining({ did: expect.any(String) }),
      }),
    );
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

  it('URL-encodes special characters in UID when building DID', async () => {
    const specialUid = 'uid with spaces+and@chars';
    const expectedDid = `did:axiom:axiomid.app:pi:${encodeURIComponent(specialUid)}`;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: specialUid }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'encoded-user',
      walletAddress: `pi:${specialUid}`,
      piUid: specialUid,
      piUsername: 'encoded',
      xp: 0,
      tier: 'Visitor',
      did: expectedDid,
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid: specialUid,
      username: 'encoded',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.did).toBe(expectedDid);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          did: expectedDid,
        }),
      }),
    );
  });

  it('uses client-provided walletAddress when supplied', async () => {
    const clientWallet = '0xdeadbeef';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'wallet-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'wallet-user',
      walletAddress: clientWallet,
      piUid: 'wallet-uid',
      piUsername: 'walletuser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi:wallet-uid',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    await POST(mockRequest({
      accessToken: 'token',
      uid: 'wallet-uid',
      username: 'walletuser',
      walletAddress: clientWallet,
    }));

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletAddress: clientWallet,
        }),
      }),
    );
  });

  it('defaults walletAddress to pi:<uid> when client does not provide one', async () => {
    const uid = 'no-wallet-uid';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'no-wallet-user',
      walletAddress: `pi:${uid}`,
      piUid: uid,
      piUsername: 'user',
      xp: 0,
      tier: 'Visitor',
      did: `did:axiom:axiomid.app:pi:${uid}`,
      kycStatus: 'NONE',
      agent: null,
    } as any);

    await POST(mockRequest({
      accessToken: 'token',
      uid,
      username: 'user',
    }));

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletAddress: `pi:${uid}`,
        }),
      }),
    );
  });

  it('does not include didMethod in update payload for returning users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'update-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'update-user',
      piUid: 'update-uid',
      did: 'did:axiom:existing',
    } as any);
    mockPrisma.user.update.mockResolvedValue({
      id: 'update-user',
      walletAddress: 'pi:update-uid',
      piUid: 'update-uid',
      piUsername: 'updater',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:existing',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    await POST(mockRequest({
      accessToken: 'token',
      uid: 'update-uid',
      username: 'updater',
    }));

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ didMethod: expect.any(String) }),
      }),
    );
  });

  it('falls back to computed piDid in response when DB user.did is null', async () => {
    const uid = 'fallback-uid';
    const expectedDid = `did:axiom:axiomid.app:pi:${uid}`;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    // Simulate DB returning null for did (e.g. a race or unexpected state)
    mockPrisma.user.create.mockResolvedValue({
      id: 'fallback-user',
      walletAddress: `pi:${uid}`,
      piUid: uid,
      piUsername: 'fallback',
      xp: 0,
      tier: 'Visitor',
      did: null,
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid,
      username: 'fallback',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.did).toBe(expectedDid);
  });

  it('repairs empty-string DID (falsy) for existing Pi user', async () => {
    const uid = 'empty-did-uid';
    const expectedDid = `did:axiom:axiomid.app:pi:${uid}`;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'empty-did-user',
      piUid: uid,
      did: '',
    } as any);
    mockPrisma.user.update.mockResolvedValue({
      id: 'empty-did-user',
      walletAddress: `pi:${uid}`,
      piUid: uid,
      piUsername: 'emptyuser',
      xp: 0,
      tier: 'Visitor',
      did: expectedDid,
      kycStatus: 'NONE',
      agent: null,
    } as any);

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid,
      username: 'emptyuser',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.did).toBe(expectedDid);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ did: expectedDid }),
      }),
    );
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const { checkRateLimit } = jest.requireMock('@/lib/rate-limiter') as {
      checkRateLimit: jest.Mock;
    };
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid: 'uid',
      username: 'user',
    }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('RATE_LIMITED');
  });

  it('returns 500 on database error during user creation', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'db-error-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error('DB connection failed'));

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid: 'db-error-uid',
      username: 'user',
    }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('returns 500 on database error during user update', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'db-update-error-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      piUid: 'db-update-error-uid',
      did: 'did:axiom:existing',
    } as any);
    mockPrisma.user.update.mockRejectedValue(new Error('Write failed'));

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid: 'db-update-error-uid',
      username: 'user',
    }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('returns 401 when Pi API call throws a network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    const res = await POST(mockRequest({
      accessToken: 'token',
      uid: 'net-error-uid',
      username: 'user',
    }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('PI_AUTH_FAILED');
  });

  it('sets didMethod to did:axiom when creating new user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'method-uid' }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'method-user',
      walletAddress: 'pi:method-uid',
      piUid: 'method-uid',
      piUsername: 'methoduser',
      xp: 0,
      tier: 'Visitor',
      did: 'did:axiom:axiomid.app:pi:method-uid',
      kycStatus: 'NONE',
      agent: null,
    } as any);

    await POST(mockRequest({
      accessToken: 'token',
      uid: 'method-uid',
      username: 'methoduser',
    }));

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          didMethod: 'did:axiom',
        }),
      }),
    );
  });
});
