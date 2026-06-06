/**
 * @jest-environment node
 */
// meta-loop.test.ts — Full 5-layer audit trail tests

import {
  runMetaLoop,
  defaultPlan,
  defaultObserve,
  defaultCritique,
  defaultImprove,
  type MetaLoopConfig,
} from "@/lib/meta-loop";

const makeConfig = (overrides: Partial<MetaLoopConfig<string, string>> = {}): MetaLoopConfig<string, string> => ({
  plan: defaultPlan,
  execute: async (steps, input) => `result:${input}:${steps.length}steps`,
  observe: defaultObserve,
  critique: defaultCritique,
  improve: defaultImprove,
  ...overrides,
});

describe("runMetaLoop", () => {
  it("returns exactly 5 layer traces in order", async () => {
    const result = await runMetaLoop("test-input", makeConfig());
    expect(result.traces).toHaveLength(5);
    expect(result.traces.map((t) => t.layer)).toEqual([
      "PLAN", "EXECUTE", "OBSERVE", "CRITIQUE", "IMPROVE",
    ]);
  });

  it("produces output from EXECUTE layer", async () => {
    const result = await runMetaLoop("hello", makeConfig());
    expect(result.output).toMatch(/result:hello/);
  });

  it("score is between 0 and 1", async () => {
    const result = await runMetaLoop("x", makeConfig());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("captures errors in trace without throwing", async () => {
    const errorConfig = makeConfig({
      execute: async () => { throw new Error("boom"); },
    });
    const result = await runMetaLoop("x", errorConfig);
    const execTrace = result.traces.find((t) => t.layer === "EXECUTE");
    expect(execTrace?.error).toBe("boom");
  });

  it("totalDurationMs is positive", async () => {
    const result = await runMetaLoop("x", makeConfig());
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("delta is string (empty on high score)", async () => {
    const result = await runMetaLoop("x", makeConfig({
      critique: async () => ({ score: 1.0, issues: [] }),
    }));
    expect(typeof result.delta).toBe("string");
    expect(result.delta).toBe("");
  });

  it("IMPROVE generates fix hint when issues exist", async () => {
    const result = await runMetaLoop("x", makeConfig({
      critique: async () => ({ score: 0.1, issues: ["Output missing"] }),
    }));
    expect(result.delta).toContain("Output missing");
  });
});
