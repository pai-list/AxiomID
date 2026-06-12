import { jest } from "@jest/globals";

/**
 * Shared factory for a default mock WalletContext value.
 * Import this in component tests that mock `@/app/context/wallet-context`.
 */
export function defaultWalletCtx(overrides: Record<string, any> = {}): any {
  return {
    user: null,
    isLoading: false,
    isConnecting: false,
    error: null,
    isPiBrowser: false,
    connectWallet: jest.fn(),
    logout: jest.fn(),
    claimAction: jest.fn(),
    refreshUser: jest.fn(),
    createAgent: jest.fn(),
    activateAgent: jest.fn(),
    pauseAgent: jest.fn(),
    levelProgress: 0,
    nextXP: null,
    walletLogs: [],
    runWalletTest: jest.fn(),
    clearWalletLogs: jest.fn(),
    ...overrides,
  };
}