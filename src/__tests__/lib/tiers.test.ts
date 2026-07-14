import {
  TIERS,
  TIER_COLORS,
  SCORE_THRESHOLDS,
  getTierColor,
  getScoreColor,
  calculateTier,
  getLevelProgress,
  getNextLevelXP,
  Tier
} from '../../../src/lib/tiers';

describe('Tiers Utility', () => {
  describe('SCORE_THRESHOLDS', () => {
    it('should have correct score values', () => {
      expect(SCORE_THRESHOLDS.EXCELLENT).toBe(80);
      expect(SCORE_THRESHOLDS.GOOD).toBe(60);
      expect(SCORE_THRESHOLDS.FAIR).toBe(40);
    });
  });

  describe('getTierColor', () => {
    it('returns correct color for each tier', () => {
      expect(getTierColor('Visitor')).toBe(TIER_COLORS.Visitor);
      expect(getTierColor('Citizen')).toBe(TIER_COLORS.Citizen);
      expect(getTierColor('Validator')).toBe(TIER_COLORS.Validator);
      expect(getTierColor('Sovereign')).toBe(TIER_COLORS.Sovereign);
    });

    it('returns Visitor color as fallback for unknown tiers', () => {
      expect(getTierColor('UnknownTier' as Tier)).toBe(TIER_COLORS.Visitor);
    });
  });

  describe('getScoreColor', () => {
    it('returns EXCELLENT color for score >= 80', () => {
      expect(getScoreColor(100)).toBe('#00ff41');
      expect(getScoreColor(SCORE_THRESHOLDS.EXCELLENT)).toBe('#00ff41');
    });

    it('returns GOOD color for score >= 60 and < 80', () => {
      expect(getScoreColor(79)).toBe('#00d4ff');
      expect(getScoreColor(SCORE_THRESHOLDS.GOOD)).toBe('#00d4ff');
    });

    it('returns FAIR color for score >= 40 and < 60', () => {
      expect(getScoreColor(59)).toBe('#f59e0b');
      expect(getScoreColor(SCORE_THRESHOLDS.FAIR)).toBe('#f59e0b');
    });

    it('returns failing color for score < 40', () => {
      expect(getScoreColor(39)).toBe('#ef4444');
      expect(getScoreColor(0)).toBe('#ef4444');
      expect(getScoreColor(-10)).toBe('#ef4444'); // edge case: negative
    });
  });

  describe('calculateTier', () => {
    it('returns Sovereign for XP >= 1000', () => {
      expect(calculateTier(TIERS.Sovereign)).toBe('Sovereign');
      expect(calculateTier(5000)).toBe('Sovereign');
    });

    it('returns Validator for XP >= 500 and < 1000', () => {
      expect(calculateTier(TIERS.Validator)).toBe('Validator');
      expect(calculateTier(999)).toBe('Validator');
    });

    it('returns Citizen for XP >= 100 and < 500', () => {
      expect(calculateTier(TIERS.Citizen)).toBe('Citizen');
      expect(calculateTier(499)).toBe('Citizen');
    });

    it('returns Visitor for XP < 100', () => {
      expect(calculateTier(99)).toBe('Visitor');
      expect(calculateTier(0)).toBe('Visitor');
      expect(calculateTier(-50)).toBe('Visitor'); // edge case: negative XP
    });
  });

  describe('getLevelProgress', () => {
    it('returns 0 when XP is exactly at the current tier threshold', () => {
      expect(getLevelProgress(TIERS.Visitor, 'Visitor')).toBe(0);
      expect(getLevelProgress(TIERS.Citizen, 'Citizen')).toBe(0);
    });

    it('calculates correct progress percentage', () => {
      // Citizen (100) to Validator (500) -> range is 400
      // 300 XP is 200 above Citizen -> 200 / 400 = 50%
      expect(getLevelProgress(300, 'Citizen')).toBe(50);

      // Visitor (0) to Citizen (100) -> range is 100
      // 25 XP -> 25%
      expect(getLevelProgress(25, 'Visitor')).toBe(25);
    });

    it('caps progress at 100% if XP exceeds next tier threshold', () => {
      expect(getLevelProgress(1000, 'Visitor')).toBe(100);
    });

    it('floors progress at 0% if XP is below current tier threshold', () => {
      expect(getLevelProgress(50, 'Citizen')).toBe(0);
      expect(getLevelProgress(-10, 'Visitor')).toBe(0);
    });

    it('returns 100% for the maximum tier (Sovereign)', () => {
      expect(getLevelProgress(TIERS.Sovereign, 'Sovereign')).toBe(100);
      expect(getLevelProgress(9999, 'Sovereign')).toBe(100);
    });
  });

  describe('getNextLevelXP', () => {
    it('returns next tier XP for valid lower tiers', () => {
      expect(getNextLevelXP('Visitor')).toBe(TIERS.Citizen);
      expect(getNextLevelXP('Citizen')).toBe(TIERS.Validator);
      expect(getNextLevelXP('Validator')).toBe(TIERS.Sovereign);
    });

    it('returns null for the maximum tier (Sovereign)', () => {
      expect(getNextLevelXP('Sovereign')).toBeNull();
    });

    it('returns null for unknown tiers', () => {
      expect(getNextLevelXP('UnknownTier' as Tier)).toBeNull();
    });
  });
});
