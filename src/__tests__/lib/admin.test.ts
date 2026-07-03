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
