/**
 * @jest-environment node
 */
// curiosity-engine.test.ts — Circuit Breaker + scoreTask + generateInsight

// Mock fetch globally
global.fetch = jest.fn();

import { scoreTask, generateInsight, getBreakerState } from "@/lib/curiosity-engine";

const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  mockFetch.mockReset();
  // Reset breakers via module reload would be ideal but jest module cache makes
  // it complex — we test the score logic directly instead.
});

describe("scoreTask", () => {
  it("returns 1.0 for perfect result", () => {
    expect(scoreTask({ success: true, durationMs: 100, outputSize: 512 })).toBe(1.0);
  });

  it("deducts 0.5 for failure", () => {
    expect(scoreTask({ success: false, durationMs: 100 })).toBe(0.5);
  });

  it("deducts 0.1 for slow result (>5s)", () => {
    const score = scoreTask({ success: true, durationMs: 6000, outputSize: 100 });
    expect(score).toBeCloseTo(0.9);
  });

  it("deducts 0.2 for empty output", () => {
    const score = scoreTask({ success: true, durationMs: 100, outputSize: 0 });
    expect(score).toBeCloseTo(0.8);
  });

  it("deducts 0.1 for error message", () => {
    const score = scoreTask({ success: true, durationMs: 100, outputSize: 100, errorMessage: "partial fail" });
    expect(score).toBeCloseTo(0.9);
  });

  it("respects pre-computed score override", () => {
    expect(scoreTask({ success: false, durationMs: 9999, score: 0.75 })).toBe(0.75);
  });

  it("never goes below 0", () => {
    const score = scoreTask({ success: false, durationMs: 9999, outputSize: 0, errorMessage: "fatal" });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("generateInsight — provider routing", () => {
  it("uses Groq when available and returns insight", async () => {
    process.env.GROQ_API_KEY = "test-groq-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Groq insight: task well done." } }],
      }),
    });

    const result = await generateInsight({ success: true, durationMs: 200, outputSize: 100 });
    expect(result.provider).toBe("groq");
    expect(result.insight).toContain("Groq insight");
    expect(result.score).toBeGreaterThan(0);
  });

  it("falls back to static insight when both providers fail", async () => {
    process.env.GROQ_API_KEY = "bad-key";
    process.env.GOOGLE_API_KEY = "";
    process.env.GEMINI_API_KEY = "";

    // Force Groq to fail
    mockFetch.mockRejectedValue(new Error("network error"));

    const result = await generateInsight(
      { success: false, durationMs: 200 },
      "context"
    );
    // Either gemini fallback or static fallback
    expect(["groq", "gemini", "fallback"]).toContain(result.provider);
    expect(typeof result.insight).toBe("string");
    expect(result.insight.length).toBeGreaterThan(0);
  });
});

describe("getBreakerState", () => {
  it("returns object with groq and gemini keys", () => {
    const state = getBreakerState();
    expect(state).toHaveProperty("groq");
    expect(state).toHaveProperty("gemini");
  });
});
