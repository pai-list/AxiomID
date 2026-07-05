import {
  normalizeStamps,
  normalizeXp,
  normalizeTenure,
  computeTrustScore,
} from "./agentScript";

describe("Trust Scoring Skill", () => {
  // ─── normalizeStamps ──────────────────────────────────────────────────

  describe("normalizeStamps", () => {
    it("returns 0 for 0 stamps", () => {
      expect(normalizeStamps(0)).toBe(0);
    });

    it("returns 100 for 10 stamps (max)", () => {
      expect(normalizeStamps(10)).toBe(100);
    });

    it("returns 50 for 5 stamps", () => {
      expect(normalizeStamps(5)).toBe(50);
    });

    it("clamps negative to 0", () => {
      expect(normalizeStamps(-5)).toBe(0);
    });

    it("clamps over max to 100", () => {
      expect(normalizeStamps(15)).toBe(100);
    });
  });

  // ─── normalizeXp ──────────────────────────────────────────────────────

  describe("normalizeXp", () => {
    it("returns 0 for 0 XP", () => {
      expect(normalizeXp(0)).toBe(0);
    });

    it("returns 100 for 1000+ XP", () => {
      expect(normalizeXp(1000)).toBe(100);
      expect(normalizeXp(1500)).toBe(100);
    });

    it("returns 50 for 500 XP", () => {
      expect(normalizeXp(500)).toBe(50);
    });

    it("floors fractional XP", () => {
      expect(normalizeXp(55)).toBe(5);
    });
  });

  // ─── normalizeTenure ──────────────────────────────────────────────────

  describe("normalizeTenure", () => {
    it("returns 0 for 0 days", () => {
      expect(normalizeTenure(0)).toBe(0);
    });

    it("returns 100 for 50+ days", () => {
      expect(normalizeTenure(50)).toBe(100);
      expect(normalizeTenure(100)).toBe(100);
    });

    it("returns 20 for 10 days", () => {
      expect(normalizeTenure(10)).toBe(20);
    });
  });

  // ─── computeTrustScore ────────────────────────────────────────────────

  describe("computeTrustScore", () => {
    it("computes legacy score (no tenure/semantic)", () => {
      const result = computeTrustScore({ xp: 500, stampsClaimed: 5 });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components.tenureScore).toBeNull();
      expect(result.components.semanticScore).toBeNull();
    });

    it("computes full score with tenure and semantic", () => {
      const result = computeTrustScore({
        xp: 500,
        stampsClaimed: 5,
        tenureDays: 25,
        semanticTrust: 75,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components.tenureScore).toBe(50);
      expect(result.components.semanticScore).toBe(75);
    });

    it("returns 0 for zero XP and zero stamps", () => {
      const result = computeTrustScore({ xp: 0, stampsClaimed: 0 });
      expect(result.score).toBe(0);
    });

    it("handles max values", () => {
      const result = computeTrustScore({
        xp: 10000,
        stampsClaimed: 10,
        tenureDays: 100,
        semanticTrust: 100,
      });
      expect(result.score).toBe(100);
    });

    it("includes breakdown string", () => {
      const result = computeTrustScore({ xp: 100, stampsClaimed: 3 });
      expect(result.breakdown).toContain("legacy");
      expect(result.breakdown).toContain("xp(");
      expect(result.breakdown).toContain("stamps(");
    });

    it("handles negative XP gracefully (clamped to 0)", () => {
      const result = computeTrustScore({ xp: -10, stampsClaimed: 0 });
      expect(result.score).toBe(0);
      expect(result.components.xpScore).toBe(0);
    });

    it("rejects semanticTrust > 100", () => {
      expect(() =>
        computeTrustScore({
          xp: 100,
          stampsClaimed: 0,
          semanticTrust: 150,
        })
      ).toThrow();
    });
  });
});
