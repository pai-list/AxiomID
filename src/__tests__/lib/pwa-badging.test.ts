import { setSovereignBadge, clearSovereignBadge, BadgeEvent } from '@/lib/pwa-badging';
import { logger } from '@/lib/logger';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PWA Badging Service', () => {
  let originalNavigator: any;

  beforeEach(() => {
    // Save original navigator and create a mock for each test
    originalNavigator = global.navigator;

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  const mockNavigatorWithBadging = (setAppBadgeMock = jest.fn(), clearAppBadgeMock = jest.fn()) => {
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        setAppBadge: setAppBadgeMock,
        clearAppBadge: clearAppBadgeMock,
      },
      configurable: true,
      writable: true,
    });
    return { setAppBadgeMock, clearAppBadgeMock };
  };

  const mockNavigatorWithoutBadging = () => {
    const nav = { ...originalNavigator };
    delete nav.setAppBadge;
    delete nav.clearAppBadge;
    Object.defineProperty(global, 'navigator', {
      value: nav,
      configurable: true,
      writable: true,
    });
  };

  describe('setSovereignBadge', () => {
    it('returns currentCount when App Badging API is not supported', async () => {
      mockNavigatorWithoutBadging();
      const currentCount = 5;
      const result = await setSovereignBadge('XP_GAIN', currentCount);

      expect(result).toBe(currentCount);
      expect(logger.info).toHaveBeenCalledWith('[PWA] App Badging API not supported in this browser.');
    });

    it('does not badge for low priority events if current count > 0', async () => {
      const { setAppBadgeMock } = mockNavigatorWithBadging();
      const currentCount = 1;
      const result = await setSovereignBadge('XP_GAIN', currentCount); // XP_GAIN is low priority

      expect(result).toBe(currentCount);
      expect(setAppBadgeMock).not.toHaveBeenCalled();
    });

    it('badges for low priority events if current count is 0', async () => {
      const { setAppBadgeMock } = mockNavigatorWithBadging();
      const currentCount = 0;
      const result = await setSovereignBadge('XP_GAIN', currentCount);

      expect(result).toBe(1);
      expect(setAppBadgeMock).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith('[PWA] Badge set to 1 for XP Boost!');
    });

    it('badges for high priority events even if current count > 0', async () => {
      const { setAppBadgeMock } = mockNavigatorWithBadging();
      const currentCount = 2;
      const result = await setSovereignBadge('NEW_STAMP', currentCount); // NEW_STAMP is high priority

      expect(result).toBe(3);
      expect(setAppBadgeMock).toHaveBeenCalledWith(3);
      expect(logger.info).toHaveBeenCalledWith('[PWA] Badge set to 3 for New Stamp!');
    });

    it('handles setAppBadge errors gracefully and returns current count', async () => {
      const setAppBadgeMock = jest.fn().mockRejectedValue(new Error('Permission denied'));
      mockNavigatorWithBadging(setAppBadgeMock);

      const currentCount = 0;
      const result = await setSovereignBadge('AGENT_READY', currentCount);

      expect(result).toBe(currentCount);
      expect(logger.error).toHaveBeenCalledWith('[PWA] Failed to set app badge:', expect.any(Error));
    });
  });


    it('uses default currentCount of 0 if not provided', async () => {
      const { setAppBadgeMock } = mockNavigatorWithBadging();
      const result = await setSovereignBadge('XP_GAIN');

      expect(result).toBe(1);
      expect(setAppBadgeMock).toHaveBeenCalledWith(1);
    });

  describe('clearSovereignBadge', () => {
    it('returns silently when App Badging API is not supported', async () => {
      mockNavigatorWithoutBadging();
      await clearSovereignBadge();

      // Since it's unsupported, it should just return early, neither info nor error should be logged by clearSovereignBadge
      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('clears the app badge successfully', async () => {
      const { clearAppBadgeMock } = mockNavigatorWithBadging();

      await clearSovereignBadge();

      expect(clearAppBadgeMock).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('[PWA] App badge cleared.');
    });

    it('handles clearAppBadge errors gracefully', async () => {
      const clearAppBadgeMock = jest.fn().mockRejectedValue(new Error('Unexpected error'));
      mockNavigatorWithBadging(jest.fn(), clearAppBadgeMock);

      await clearSovereignBadge();

      expect(clearAppBadgeMock).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('[PWA] Failed to clear app badge:', expect.any(Error));
    });
  });
});
