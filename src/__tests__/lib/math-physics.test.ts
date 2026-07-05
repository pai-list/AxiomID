import {
  leakyBucketCheck,
  exponentialBackoff,
  shannonEntropy,
  dataFreshness,
  idealGasPressure
} from "@/lib/math-physics";

describe("math-physics (refactored ponytail edition)", () => {
  describe("leakyBucketCheck", () => {
    it("allows request when bucket is empty", () => {
      const state = { level: 0, lastDrain: 1000, overflowCount: 0 };
      const config = { capacity: 10, drainRate: 1, inflowRate: 1 };
      const res = leakyBucketCheck(state, config, 2000);
      expect(res.allowed).toBe(true);
    });

    it("rejects request when bucket is full", () => {
      const state = { level: 10, lastDrain: 1000, overflowCount: 0 };
      const config = { capacity: 10, drainRate: 1, inflowRate: 1 };
      const res = leakyBucketCheck(state, config, 1000); // no time passed
      expect(res.allowed).toBe(false);
    });
  });

  describe("exponentialBackoff", () => {
    it("calculates backoff without jitter", () => {
      const delay = exponentialBackoff(1, 1000, 30000, false);
      expect(delay).toBe(2000);
    });

    it("caps at maxMs", () => {
      const delay = exponentialBackoff(10, 1000, 5000, false);
      expect(delay).toBe(5000);
    });
  });

  describe("shannonEntropy", () => {
    it("calculates entropy of a string", () => {
      expect(shannonEntropy("a")).toBe(0);
      expect(shannonEntropy("ab")).toBe(1);
    });

    it("returns 0 for empty string", () => {
      expect(shannonEntropy("")).toBe(0);
    });
  });

  describe("dataFreshness", () => {
    it("returns 1 for current data", () => {
      expect(dataFreshness(1000, 1000, 1000)).toBe(1);
    });

    it("decays to 0.5 after one half-life", () => {
      expect(dataFreshness(1000, 1000, 2000)).toBe(0.5);
    });
  });

  describe("idealGasPressure", () => {
    it("calculates pressure correctly", () => {
      expect(idealGasPressure(1, 1, 1, 1)).toBe(1);
    });

    it("returns Infinity when volume is 0", () => {
      expect(idealGasPressure(1, 0, 1)).toBe(Infinity);
    });
  });
});
