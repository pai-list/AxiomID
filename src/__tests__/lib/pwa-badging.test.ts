import { setSovereignBadge, clearSovereignBadge, BadgeEvent } from '@/lib/pwa-badging';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PWA Badging', () => {
  let originalNavigator: typeof global.navigator;

  beforeAll(() => {
    originalNavigator = global.navigator;
  });

  afterAll(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setSovereignBadge', () => {
    it('returns current count if setAppBadge is not supported', async () => {
      const result = await setSovereignBadge('XP_GAIN', 5);
      expect(result).toBe(5);
      expect(logger.info).toHaveBeenCalledWith('[PWA] App Badging API not supported in this browser.');
    });

    it('returns current count if event is low priority and current count > 0', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { setAppBadge: jest.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const result = await setSovereignBadge('XP_GAIN', 2);
      expect(result).toBe(2);
      expect(navigator.setAppBadge).not.toHaveBeenCalled();
    });

    it('sets badge to 1 for low priority event if current count is 0', async () => {
      const setAppBadgeMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: { setAppBadge: setAppBadgeMock },
        writable: true,
      });

      const result = await setSovereignBadge('XP_GAIN', 0);
      expect(result).toBe(1);
      expect(setAppBadgeMock).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith('[PWA] Badge set to 1 for XP Boost!');
    });

    it('increments badge count for high priority event even if count > 0', async () => {
      const setAppBadgeMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: { setAppBadge: setAppBadgeMock },
        writable: true,
      });

      const result = await setSovereignBadge('NEW_STAMP', 3);
      expect(result).toBe(4);
      expect(setAppBadgeMock).toHaveBeenCalledWith(4);
      expect(logger.info).toHaveBeenCalledWith('[PWA] Badge set to 4 for New Stamp!');
    });

    it('defaults currentCount to 0 if not provided and sets badge to 1', async () => {
      const setAppBadgeMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: { setAppBadge: setAppBadgeMock },
        writable: true,
      });

      const result = await setSovereignBadge('AGENT_READY');
      expect(result).toBe(1);
      expect(setAppBadgeMock).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith('[PWA] Badge set to 1 for Agent Active');
    });

    it('returns current count if setAppBadge throws an error', async () => {
      const error = new Error('Test Error');
      const setAppBadgeMock = jest.fn().mockRejectedValue(error);
      Object.defineProperty(global, 'navigator', {
        value: { setAppBadge: setAppBadgeMock },
        writable: true,
      });

      const result = await setSovereignBadge('NEW_STAMP', 2);
      expect(result).toBe(2);
      expect(setAppBadgeMock).toHaveBeenCalledWith(3);
      expect(logger.error).toHaveBeenCalledWith('[PWA] Failed to set app badge:', error);
    });
  });

  describe('clearSovereignBadge', () => {
    it('returns early if setAppBadge is not supported', async () => {
      await clearSovereignBadge();
      // Since it early returns, clearAppBadge is not called, console is not called.
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('clears badge if supported', async () => {
      const clearAppBadgeMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: {
          setAppBadge: jest.fn(),
          clearAppBadge: clearAppBadgeMock
        },
        writable: true,
      });

      await clearSovereignBadge();
      expect(clearAppBadgeMock).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('[PWA] App badge cleared.');
    });

    it('logs error if clearAppBadge throws an error', async () => {
      const error = new Error('Clear Error');
      const clearAppBadgeMock = jest.fn().mockRejectedValue(error);
      Object.defineProperty(global, 'navigator', {
        value: {
          setAppBadge: jest.fn(),
          clearAppBadge: clearAppBadgeMock
        },
        writable: true,
      });

      await clearSovereignBadge();
      expect(clearAppBadgeMock).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('[PWA] Failed to clear app badge:', error);
    });
  });
});
