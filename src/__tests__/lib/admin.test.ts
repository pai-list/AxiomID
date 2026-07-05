import { AuthenticatedUser } from '@/lib/auth-middleware';

describe('Admin Utility - isAdmin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return true if the user wallet is in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return false if the user wallet is not in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet3' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should handle empty ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should handle undefined ADMIN_WALLETS', async () => {
    delete process.env.ADMIN_WALLETS;
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should trim whitespace from ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = '  wallet1  ,  wallet2  ';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should ignore empty entries in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1,,wallet2,';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });
});

describe('Admin Utility - isAdmin (role-based check, PR change)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns true when user.role is ADMIN, regardless of wallet address', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'not-in-list', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('returns true when user.role is ADMIN even when ADMIN_WALLETS is unset', async () => {
    delete process.env.ADMIN_WALLETS;
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet-x', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('returns true when user.role is ADMIN even when ADMIN_WALLETS is empty', async () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet-x', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('returns false when user.role is USER and wallet is not in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet3', role: 'USER' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('falls back to ADMIN_WALLETS when user.role is USER but the wallet is listed', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'USER' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('returns false when role is undefined and wallet is not in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet3' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('does not treat a lowercase "admin" role as an admin (exact match required)', async () => {
    delete process.env.ADMIN_WALLETS;
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet-y', role: 'admin' } as unknown as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });
});
