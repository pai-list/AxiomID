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

describe('Admin Utility - isAdmin (PR change: role-based check)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return true when user.role is ADMIN, regardless of ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'not-in-list', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return true when user.role is ADMIN even if ADMIN_WALLETS is empty', async () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return true when user.role is ADMIN even if ADMIN_WALLETS is undefined', async () => {
    delete process.env.ADMIN_WALLETS;
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'ADMIN' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return false when user.role is USER and wallet is not in ADMIN_WALLETS', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet3', role: 'USER' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should return true when user.role is USER but wallet IS in ADMIN_WALLETS (fallback still works)', async () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'USER' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return false when role is USER and ADMIN_WALLETS is empty', async () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'USER' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should fall back to wallet-based check when role is missing (backward compatibility)', async () => {
    process.env.ADMIN_WALLETS = 'wallet1';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should not treat an arbitrary truthy role string as admin', async () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

    const user = { walletAddress: 'wallet1', role: 'SUPERADMIN' } as unknown as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });
});
