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

  describe('role-based admin check (PR change)', () => {
    it('should return true when user.role is "ADMIN", even with empty ADMIN_WALLETS', async () => {
      process.env.ADMIN_WALLETS = '';
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'ADMIN', walletAddress: 'wallet-not-listed' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(true);
    });

    it('should return true when user.role is "ADMIN", even with undefined ADMIN_WALLETS', async () => {
      delete process.env.ADMIN_WALLETS;
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'ADMIN', walletAddress: 'wallet-not-listed' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(true);
    });

    it('should return true when user.role is "ADMIN" even if the wallet is not in ADMIN_WALLETS', async () => {
      process.env.ADMIN_WALLETS = 'wallet1, wallet2';
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'ADMIN', walletAddress: 'some-other-wallet' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(true);
    });

    it('should return false when user.role is "USER" and the wallet is not in ADMIN_WALLETS', async () => {
      process.env.ADMIN_WALLETS = 'wallet1, wallet2';
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'USER', walletAddress: 'wallet3' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(false);
    });

    it('should still return true via the wallet fallback when user.role is "USER" but the wallet is listed', async () => {
      process.env.ADMIN_WALLETS = 'wallet1, wallet2';
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'USER', walletAddress: 'wallet1' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(true);
    });

    it('should return true when both role is "ADMIN" and the wallet is listed in ADMIN_WALLETS', async () => {
      process.env.ADMIN_WALLETS = 'wallet1, wallet2';
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: 'ADMIN', walletAddress: 'wallet1' } as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(true);
    });

    it('should return false when role is neither "ADMIN" nor a recognized wallet is present', async () => {
      delete process.env.ADMIN_WALLETS;
      const { isAdmin: reloadedIsAdmin } = await import('@/lib/admin');

      const user = { role: undefined, walletAddress: 'wallet-x' } as unknown as AuthenticatedUser;
      expect(reloadedIsAdmin(user)).toBe(false);
    });
  });
});
