import { isAdmin } from '@/lib/admin';
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

  it('should return true if the user wallet is in ADMIN_WALLETS', () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    // Re-import the module to ensure the environment variables are picked up
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should return false if the user wallet is not in ADMIN_WALLETS', () => {
    process.env.ADMIN_WALLETS = 'wallet1, wallet2';
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet3' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should handle empty ADMIN_WALLETS', () => {
    process.env.ADMIN_WALLETS = '';
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should handle undefined ADMIN_WALLETS', () => {
    delete process.env.ADMIN_WALLETS;
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(false);
  });

  it('should trim whitespace from ADMIN_WALLETS', () => {
    process.env.ADMIN_WALLETS = '  wallet1  ,  wallet2  ';
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });

  it('should ignore empty entries in ADMIN_WALLETS', () => {
    process.env.ADMIN_WALLETS = 'wallet1,,wallet2,';
    const { isAdmin: reloadedIsAdmin } = require('@/lib/admin');

    const user = { walletAddress: 'wallet1' } as AuthenticatedUser;
    expect(reloadedIsAdmin(user)).toBe(true);
  });
});
