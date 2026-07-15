 
/**
 * @jest-environment node
 */

jest.unmock('@/lib/auth-middleware');

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/errors', () => ({
  apiError: jest.fn((code: string, message: string) => ({
    status: 401,
    json: async () => ({ code, message }),
  })),
}));

jest.mock('@/lib/auth-tokens', () => ({
  verifyPiTokenWithJwks: jest.fn().mockRejectedValue(new Error("JWKS verification not available in tests")),
}));

jest.mock('@/lib/sandbox-token', () => ({
  getSandboxDevToken: jest.fn().mockReturnValue(undefined),
}));

jest.mock('@/lib/revocation-store', () => {
  return {
    isTokenRevoked: jest.fn().mockResolvedValue(false),
    revokeToken: jest.fn().mockResolvedValue(undefined),
  };
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { requireAuth, clearAuthCache, hashToken, type AuthenticatedUser } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { getSandboxDevToken } from '@/lib/sandbox-token';
import { isTokenRevoked } from '@/lib/revocation-store';
import { verifyPiTokenWithJwks } from '@/lib/auth-tokens';

let testTokenCounter = 0;
const makeTestToken = (suffix: string) => "test-token-mock-" + suffix + "-" + (++testTokenCounter);

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function mockRequestWithHeader(headers: Record<string, string> = {}) {
  const allHeaders: Record<string, string> = {};
  Object.keys(headers).forEach(k => {
    allHeaders[k.toLowerCase()] = headers[k];
  });
  if (allHeaders["user-agent"] === undefined) {
    allHeaders["user-agent"] = "Pi Browser / AxiomID Testing";
  }
  return {
    headers: {
      get: (name: string) => allHeaders[name.toLowerCase()] ?? null,
    },
    nextUrl: new URL("http://localhost/"),
  } as unknown as NextRequest; // ponytail: test mock — NextRequest-like object without full type
}

describe('makeTestToken (PR change: unique token generator for tests)', () => {
  it('includes the provided suffix in the generated token', () => {
    const token = makeTestToken('my-suffix');
    expect(token).toContain('my-suffix');
    expect(token.startsWith('test-token-mock-my-suffix-')).toBe(true);
  });

  it('generates a different token on each call, even with the same suffix', () => {
    const tokenA = makeTestToken('dup');
    const tokenB = makeTestToken('dup');
    expect(tokenA).not.toBe(tokenB);
  });

  it('appends a numeric, monotonically increasing counter', () => {
    const tokenA = makeTestToken('seq');
    const tokenB = makeTestToken('seq');
    const numA = Number(tokenA.split('-').pop());
    const numB = Number(tokenB.split('-').pop());
    expect(Number.isNaN(numA)).toBe(false);
    expect(Number.isNaN(numB)).toBe(false);
    expect(numB).toBeGreaterThan(numA);
  });
});

describe('hashToken (PR change: exported)', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const result = hashToken('any-token');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hashes for different tokens', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('is deterministic — same token always produces same hash', () => {
    expect(hashToken('stable-token')).toBe(hashToken('stable-token'));
  });

  it('produces known SHA-256 digest for empty string', () => {
    // SHA-256('') = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(hashToken('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});

describe('clearAuthCache (PR change: selective invalidation)', () => {
  beforeEach(() => {
    // Start with a clean slate
    jest.clearAllMocks();
    mockFetch.mockClear();
    clearAuthCache();
  });

  it('clearAuthCache() with no argument clears all cache entries', () => {
    // Calling with no arg should not throw
    expect(() => clearAuthCache()).not.toThrow();
  });

  it('clearAuthCache(tokenHash) with a hash removes only that entry', () => {
    const hash = hashToken('test-token-xyz');
    // Calling with a specific hash should not throw
    expect(() => clearAuthCache(hash)).not.toThrow();
  });

  it('clearAuthCache(unknownHash) does not throw for unknown hash', () => {
    expect(() => clearAuthCache('nonexistent-hash-abc123')).not.toThrow();
  });

  it('cached user is removed after clearAuthCache(tokenHash)', async () => {
    const token = 'selective-clear-token-unique';
    const mockUser = {
      id: 'user-selective',
      walletAddress: '0xdef',
      piUid: 'pi-selective',
      piUsername: 'selectiveuser',
      xp: 0,
      tier: 'Beginner',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-selective', username: 'selectiveuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: `Bearer ${token}` });

    // Populate cache
    const result1 = await requireAuth(req);
    expect(result1.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Remove specific token from cache
    clearAuthCache(hashToken(token));

    // Next request must re-verify (cache miss)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-selective', username: 'selectiveuser' }),
    });
    const result2 = await requireAuth(req);
    expect(result2.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('clearAuthCache(hashToken) does not affect other cached tokens', async () => {
    const tokenA = 'token-keep-me-unique';
    const tokenB = 'token-evict-me-unique';
    const mockUser = {
      id: 'user-multi',
      walletAddress: '0x999',
      piUid: 'pi-multi',
      piUsername: 'multiuser',
      xp: 0,
      tier: 'Beginner',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-multi', username: 'multiuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const reqA = mockRequestWithHeader({ authorization: `Bearer ${tokenA}` });
    const reqB = mockRequestWithHeader({ authorization: `Bearer ${tokenB}` });

    await requireAuth(reqA);
    await requireAuth(reqB);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Evict only token B
    clearAuthCache(hashToken(tokenB));

    // Token A should still be cached (no extra fetch)
    await requireAuth(reqA);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Token B needs re-verify
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-multi', username: 'multiuser' }),
    });
    await requireAuth(reqB);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    clearAuthCache();
  });

  it('returns error when Authorization header is missing', async () => {
    const req = mockRequestWithHeader({});
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('returns error when Authorization header has empty access token', async () => {
    const req = mockRequestWithHeader({ authorization: 'Bearer ' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    const response = await result.error!.json();
    expect(response.message).toBe('Empty access token');
  });

  it('returns error when Authorization header does not start with Bearer', async () => {
    const req = mockRequestWithHeader({ authorization: 'Basic abc123' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('returns error when Pi API returns non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    const req = mockRequestWithHeader({ authorization: 'Bearer test-token' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.minepi.com/v2/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  it('returns error when Pi API returns user without uid', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'testuser' }),
    });

    const req = mockRequestWithHeader({ authorization: 'Bearer test-token-no-uid' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('returns error when user not found in database', async () => {
    const token = makeTestToken('not-found');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-user-123', username: 'testuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = mockRequestWithHeader({ authorization: `Bearer ${token}` });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('returns user on successful authentication', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: '0xabc',
      piUid: 'pi-user-123',
      piUsername: 'testuser',
      xp: 100,
      tier: 'Citizen',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-user-123', username: 'testuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer test-token-success' });
    const result = await requireAuth(req);

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
  });

  it('caches user on successful authentication', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: '0xabc',
      piUid: 'pi-user-123',
      piUsername: 'testuser',
      xp: 100,
      tier: 'Citizen',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-user-123', username: 'testuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer cache-test-token' });

    // First call - hits Pi API
    const result1 = await requireAuth(req);
    expect(result1.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache (no additional Pi API call)
    const result2 = await requireAuth(req);
    expect(result2.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  it('invalidates cache on Pi API 401 response', async () => {
    // First call succeeds and caches
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uid: 'pi-user-123', username: 'testuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      walletAddress: '0xabc',
      piUid: 'pi-user-123',
      piUsername: 'testuser',
      xp: 100,
      tier: 'Citizen',
    } as unknown as AuthenticatedUser);

    const req1 = mockRequestWithHeader({ authorization: 'Bearer valid-token-1' });
    const result1 = await requireAuth(req1);
    expect(result1.user).toBeDefined();

    // Second call with a DIFFERENT token → Pi API returns 401 (token revoked)
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const req2 = mockRequestWithHeader({ authorization: 'Bearer revoked-token-2' });
    const result2 = await requireAuth(req2);
    expect(result2.user).toBeNull();
    expect(result2.error).toBeDefined();
  });

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const req = mockRequestWithHeader({ authorization: 'Bearer error-test-token' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// requireAuth — revocation-store integration (PR change: auth-middleware now
// imports isTokenRevoked from @/lib/revocation-store instead of @/lib/revocation)
// ---------------------------------------------------------------------------
describe('requireAuth — revocation check (PR change: uses revocation-store)', () => {
  // Import the real revokeToken from revocation-store so we can seed state.
  // revocation-store is not globally mocked, so the real TTL store is used.
  let revokeToken: (token: string) => Promise<void>;

  beforeAll(async () => {
    const store = await import('@/lib/revocation-store');
    revokeToken = store.revokeToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    clearAuthCache();
  });

  it('returns UNAUTHORIZED error for a revoked token without calling Pi API', async () => {
    jest.mocked(isTokenRevoked).mockResolvedValueOnce(true);
    const revokedToken = 'revocation-store-test-token-unique-abc';
    await revokeToken(revokedToken);

    const req = mockRequestWithHeader({ authorization: `Bearer ${revokedToken}` });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    // Pi API must NOT be called — revocation check is a short-circuit before fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns user for a non-revoked token (revocation store does not block valid tokens)', async () => {
    const validToken = 'revocation-store-valid-token-unique-xyz';
    // Intentionally do NOT revoke this token
    const mockUser = {
      id: 'user-revocation-test',
      walletAddress: '0xfeed',
      piUid: 'pi-revocation-test',
      piUsername: 'revocationtestuser',
      xp: 50,
      tier: 'Citizen',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-revocation-test', username: 'revocationtestuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: `Bearer ${validToken}` });
    const result = await requireAuth(req);

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
  });

  it('revocation check runs before cache lookup (revoked tokens bypass cache)', async () => {
    const token = 'revocation-before-cache-token-unique';
    const mockUser = {
      id: 'user-cache-bypass',
      walletAddress: '0xcafe',
      piUid: 'pi-cache-bypass',
      piUsername: 'cachebypassuser',
      xp: 0,
      tier: 'Visitor',
    };

    // First: authenticate successfully to populate the cache
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-cache-bypass', username: 'cachebypassuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: `Bearer ${token}` });
    const result1 = await requireAuth(req);
    expect(result1.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Now revoke the token — even though it's cached, it should be blocked
    await revokeToken(token);
    jest.mocked(isTokenRevoked).mockResolvedValueOnce(true);
    mockFetch.mockReset();

    const result2 = await requireAuth(req);
    expect(result2.user).toBeNull();
    expect(result2.error).toBeDefined();
    // Pi API still not called — revocation short-circuits before cache check
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// requireAuth — Pi Browser user-agent enforcement (PR change)
// When JWKS verification fails, the fallback now checks the User-Agent header
// for Pi Browser identity before calling the Pi API. Non-Pi-Browser requests
// are rejected unless SANDBOX_AUTH_BYPASS is set and hostname is loopback.
// ---------------------------------------------------------------------------
describe('requireAuth — Pi Browser user-agent enforcement (PR change)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    clearAuthCache();
  });

  it('rejects non-Pi-Browser user-agent when JWKS fails (no sandbox bypass)', async () => {
    // Chrome UA, no SANDBOX_AUTH_BYPASS — must be rejected before the Pi API is called
    const req = mockRequestWithHeader({
      authorization: 'Bearer chrome-only-token',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0',
    });

    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    // Pi API must NOT be called — the middleware short-circuits before fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects empty user-agent when JWKS fails (no sandbox bypass)', async () => {
    const req = mockRequestWithHeader({
      authorization: 'Bearer empty-ua-token',
      'user-agent': '',
    });

    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('accepts Pi Browser user-agent when JWKS fails (falls through to Pi API)', async () => {
    const mockUser = {
      id: 'user-pi-browser',
      walletAddress: '0xaaa',
      piUid: 'pi-ua-test-1',
      piUsername: 'pibrowseruser',
      did: null,
      xp: 0,
      tier: 'Visitor',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-ua-test-1', username: 'pibrowseruser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({
      authorization: 'Bearer pi-browser-ua-token',
      'user-agent': 'Pi Browser v4.2',
    });

    const result = await requireAuth(req);

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accepts minepi user-agent variant (case-insensitive match)', async () => {
    const mockUser = {
      id: 'user-minepi',
      walletAddress: '0xbbb',
      piUid: 'pi-ua-test-2',
      piUsername: 'minepiuser',
      did: null,
      xp: 0,
      tier: 'Visitor',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-ua-test-2', username: 'minepiuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({
      authorization: 'Bearer minepi-ua-token',
      'user-agent': 'minepi/2.0 Mobile Safari',
    });

    const result = await requireAuth(req);

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accepts PiApp user-agent variant (case-insensitive match)', async () => {
    const mockUser = {
      id: 'user-piapp',
      walletAddress: '0xccc',
      piUid: 'pi-ua-test-3',
      piUsername: 'piappuser',
      did: null,
      xp: 0,
      tier: 'Visitor',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-ua-test-3', username: 'piappuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({
      authorization: 'Bearer piapp-ua-token',
      'user-agent': 'PiApp/3.1 iOS',
    });

    const result = await requireAuth(req);

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('allows non-Pi-Browser UA when SANDBOX_AUTH_BYPASS=true and hostname is localhost', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    process.env.SANDBOX_AUTH_BYPASS = 'true';

    try {
      const mockUser = {
        id: 'user-sandbox-bypass',
        walletAddress: '0xddd',
        piUid: 'pi-sandbox-bypass',
        piUsername: 'sandboxbypassuser',
        did: null,
        xp: 0,
        tier: 'Visitor',
      };
      const token = makeTestToken('sandbox-chrome');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ uid: 'pi-sandbox-bypass', username: 'sandboxbypassuser' }),
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

      // Chrome UA but SANDBOX_AUTH_BYPASS=true + localhost → isSandboxOrDev=true → Pi Browser check bypassed
      const req = mockRequestWithHeader({
        authorization: `Bearer ${token}`,
        'user-agent': 'Mozilla/5.0 Chrome/120.0',
      });

      const result = await requireAuth(req);

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      // fetch WAS called because the Pi Browser check was bypassed
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      if (originalBypass === undefined) {
        delete process.env.SANDBOX_AUTH_BYPASS;
      } else {
        process.env.SANDBOX_AUTH_BYPASS = originalBypass;
      }
    }
  });

  it('does NOT allow SANDBOX_AUTH_BYPASS=false non-Pi-Browser requests', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    process.env.SANDBOX_AUTH_BYPASS = 'false';

    try {
      const req = mockRequestWithHeader({
        authorization: 'Bearer bypass-false-token',
        'user-agent': 'Mozilla/5.0 Chrome/120.0',
      });

      const result = await requireAuth(req);

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      if (originalBypass === undefined) {
        delete process.env.SANDBOX_AUTH_BYPASS;
      } else {
        process.env.SANDBOX_AUTH_BYPASS = originalBypass;
      }
    }
  });

  it('does not crash when nextUrl is null — falls back to "localhost" hostname', async () => {
    // Tests the null-safety fix: request.nextUrl?.hostname || "localhost"
    const mockUser = {
      id: 'user-null-url',
      walletAddress: '0xeee',
      piUid: 'pi-null-url',
      piUsername: 'nullurluser',
      did: null,
      xp: 0,
      tier: 'Visitor',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-null-url', username: 'nullurluser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    // Manually build a request with null nextUrl and a Pi Browser UA
    const req = {
      headers: {
        get: (name: string) => {
          const h: Record<string, string> = {
            authorization: 'Bearer null-nexturl-token',
            'user-agent': 'Pi Browser / AxiomID Testing',
          };
          return h[name.toLowerCase()] ?? null;
        },
      },
      nextUrl: null,
    } as unknown as NextRequest; // ponytail: test mock — NextRequest-like object with null nextUrl

    // Should not throw even when nextUrl is null
    const result = await requireAuth(req);

    // With Pi Browser UA it should proceed normally and succeed
    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
  });
});


// ---------------------------------------------------------------------------
// requireAuth - missing branches (PR change: full coverage)
// ---------------------------------------------------------------------------
describe('requireAuth - missing branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    clearAuthCache();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires cached user', async () => {
    jest.useFakeTimers();

    const mockUser = {
      id: 'user-expire-cache',
      walletAddress: '0xexpire',
      piUid: 'pi-expire',
      piUsername: 'expireuser',
      xp: 0,
      tier: 'Visitor',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-expire', username: 'expireuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer expire-token' });

    const result1 = await requireAuth(req);
    expect(result1.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(6 * 60 * 1000);

    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-expire', username: 'expireuser' }),
    });

    const result2 = await requireAuth(req);
    expect(result2.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('cleans up expired entries when cache size limit is reached', async () => {
    jest.useFakeTimers();

    const mockUser = {
      id: 'user-limit',
      walletAddress: '0xlimit',
      piUid: 'pi-limit',
      piUsername: 'limituser',
      xp: 0,
      tier: 'Visitor',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-limit', username: 'limituser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req1 = mockRequestWithHeader({ authorization: 'Bearer token-1' });
    await requireAuth(req1);

    jest.advanceTimersByTime(6 * 60 * 1000);

    for (let i = 2; i <= 1001; i++) {
      const req = mockRequestWithHeader({ authorization: `Bearer token-${i}` });
      await requireAuth(req);
    }

    const req1002 = mockRequestWithHeader({ authorization: 'Bearer token-1002' });
    await requireAuth(req1002);
  });

  it('handles isTokenRevoked rejection', async () => {
    jest.mocked(isTokenRevoked).mockRejectedValueOnce(new Error('DB connection failed'));

    const req = mockRequestWithHeader({ authorization: 'Bearer some-token' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(401);
  });

  it('skips sandbox bypass in production even if SANDBOX_AUTH_BYPASS is true', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.SANDBOX_AUTH_BYPASS = 'true';
    process.env.NODE_ENV = 'production';

    try {
      jest.mocked(getSandboxDevToken).mockReturnValue('sandbox-dev-token');
      mockFetch.mockRejectedValue(new Error('Network error'));

      const req = mockRequestWithHeader({ authorization: 'Bearer sandbox-dev-token' });
      const result = await requireAuth(req);

      expect(result.error).toBeDefined();
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('resolves sandbox user when SANDBOX_AUTH_BYPASS is true and token matches', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.SANDBOX_AUTH_BYPASS = 'true';
    process.env.NODE_ENV = 'development';

    try {
      jest.mocked(getSandboxDevToken).mockReturnValue('sandbox-dev-token');

      const sandboxUser = {
        id: 'sandbox-id',
        walletAddress: '0xsandbox',
        piUid: 'sandbox-developer',
        piUsername: 'sandboxuser',
        did: null,
        xp: 100,
        tier: 'Developer',
      };

      mockPrisma.user.findUnique.mockResolvedValue(sandboxUser as unknown as AuthenticatedUser);

      const req = mockRequestWithHeader({ authorization: 'Bearer sandbox-dev-token' });
      const result = await requireAuth(req);

      expect(result.user).toEqual(sandboxUser);
      expect(result.error).toBeNull();
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('falls through if sandbox user is not found in db', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.SANDBOX_AUTH_BYPASS = 'true';
    process.env.NODE_ENV = 'development';

    try {
      jest.mocked(getSandboxDevToken).mockReturnValue('sandbox-dev-token');

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const req = mockRequestWithHeader({ authorization: 'Bearer sandbox-dev-token' });
      const result = await requireAuth(req);

      expect(result.error).toBeDefined();
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('resolves pi user using JWKS successfully', async () => {
    const mockUser = {
      id: 'jwks-user-id',
      walletAddress: '0xjwks',
      piUid: 'jwks-uid',
      piUsername: 'jwksusername',
      did: null,
      xp: 10,
      tier: 'Visitor',
    };

    const verifyPiTokenWithJwksMock = jest.mocked(verifyPiTokenWithJwks);
    verifyPiTokenWithJwksMock.mockResolvedValueOnce({
      sub: 'jwks-uid',
      username: 'jwksusername',
    });

    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer valid-jwks-token' });
    const result = await requireAuth(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it('resolves pi user using JWKS but without username or pi_username', async () => {
    const mockUser = {
      id: 'jwks-no-username',
      walletAddress: '0xjwks2',
      piUid: 'jwks-uid-2',
      piUsername: null,
      did: null,
      xp: 10,
      tier: 'Visitor',
    };

    jest.mocked(verifyPiTokenWithJwks).mockResolvedValueOnce({
      sub: 'jwks-uid-2',
    });

    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer valid-jwks-token-no-username' });
    const result = await requireAuth(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it('resolves pi user using fallback API without username', async () => {
    const mockUser = {
      id: 'fallback-no-username',
      walletAddress: '0xfallback',
      piUid: 'pi-fallback-uid',
      piUsername: null,
      xp: 0,
      tier: 'Visitor',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'pi-fallback-uid' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    jest.mocked(verifyPiTokenWithJwks).mockRejectedValueOnce(new Error('fail jwks'));

    const req = mockRequestWithHeader({ authorization: 'Bearer fallback-token' });
    const result = await requireAuth(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it('allows non-Pi-Browser UA when SANDBOX_AUTH_BYPASS=true but loopback host is 127.0.0.1', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    process.env.SANDBOX_AUTH_BYPASS = 'true';

    try {
      const req = {
        headers: {
          get: (name: string) => name.toLowerCase() === 'authorization' ? 'Bearer somesandboxtoken' : 'Mozilla',
        },
        nextUrl: new URL("http://127.0.0.1/"),
      } as unknown as NextRequest;

      mockFetch.mockRejectedValue(new Error('Network'));

      const result = await requireAuth(req);

      expect(result.error).toBeDefined();
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
    }
  });

  it('allows non-Pi-Browser UA when SANDBOX_AUTH_BYPASS=true but loopback host is ::1', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    process.env.SANDBOX_AUTH_BYPASS = 'true';

    try {
      const req = {
        headers: {
          get: (name: string) => name.toLowerCase() === 'authorization' ? 'Bearer somesandboxtoken' : 'Mozilla',
        },
        nextUrl: new URL("http://[::1]/"),
      } as unknown as NextRequest;

      mockFetch.mockRejectedValue(new Error('Network'));

      const result = await requireAuth(req);
      expect(result.error).toBeDefined();
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
    }
  });

  it('resolves pi user using JWKS with pi_username instead of username', async () => {
    const mockUser = {
      id: 'jwks-pi-username',
      walletAddress: '0xjwks3',
      piUid: 'jwks-uid-3',
      piUsername: 'jwkspiuser',
      did: null,
      xp: 10,
      tier: 'Visitor',
    };

    jest.mocked(verifyPiTokenWithJwks).mockResolvedValueOnce({
      sub: 'jwks-uid-3',
      pi_username: 'jwkspiuser',
    });

    mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer valid-jwks-token-pi-username' });
    const result = await requireAuth(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// requireAuth — additional coverage (regression / boundary / negative cases)
// ---------------------------------------------------------------------------
describe('requireAuth - additional coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    clearAuthCache();
  });

  it('returns "Pi token missing uid" when JWKS payload has no sub, without falling back to the Pi API', async () => {
    jest.mocked(verifyPiTokenWithJwks).mockResolvedValueOnce({
      username: 'no-sub-user',
    });

    const req = mockRequestWithHeader({ authorization: 'Bearer jwks-missing-sub-token' });
    const result = await requireAuth(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    const response = await result.error!.json();
    expect(response.message).toBe('Pi token missing uid');
    // JWKS path resolved (even without uid), so the online fallback must not run
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('falls through to normal Pi Browser auth flow when sandbox bypass is enabled but access token does not match the sandbox token', async () => {
    const originalBypass = process.env.SANDBOX_AUTH_BYPASS;
    process.env.SANDBOX_AUTH_BYPASS = 'true';

    try {
      jest.mocked(getSandboxDevToken).mockReturnValue('the-real-sandbox-token');

      const mockUser = {
        id: 'user-non-matching-sandbox',
        walletAddress: '0xnomatch',
        piUid: 'pi-no-match',
        piUsername: 'nomatchuser',
        did: null,
        xp: 0,
        tier: 'Visitor',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ uid: 'pi-no-match', username: 'nomatchuser' }),
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as unknown as AuthenticatedUser);

      // Token differs from the configured sandbox token, so the sandbox
      // short-circuit must not fire — the request should go through the
      // ordinary Pi Browser fallback flow instead.
      const req = mockRequestWithHeader({ authorization: 'Bearer not-the-sandbox-token' });
      const result = await requireAuth(req);

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      process.env.SANDBOX_AUTH_BYPASS = originalBypass;
    }
  });

  it('queries prisma.user.findUnique with the piUid returned by the Pi API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'exact-uid-check', username: 'someuser' }),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-exact',
      walletAddress: '0xexact',
      piUid: 'exact-uid-check',
      piUsername: 'someuser',
      xp: 0,
      tier: 'Visitor',
    } as unknown as AuthenticatedUser);

    const req = mockRequestWithHeader({ authorization: 'Bearer exact-uid-token' });
    await requireAuth(req);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { piUid: 'exact-uid-check' } })
    );
  });
});
