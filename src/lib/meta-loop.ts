/**
 * meta-loop.ts — 5-Layer Meta-Loop Engine
 *
 * Implements the sacred deterministic meta-loop that governs every
 * agent action inside AxiomID. No task runs outside the loop.
 *
 * Layers (always active, always in order):
 *   1. PLAN     — decompose goal into atomic steps
 *   2. EXECUTE  — run the steps, collect raw output
 *   3. OBSERVE  — capture metrics, side-effects, errors
 *   4. CRITIQUE — score quality; surface what went wrong
 *   5. IMPROVE  — emit delta patch for next iteration
 *
 * RULE 5: Meta-Loop يشتغل على 5 طبقات نشطة دايماً
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LayerName = "PLAN" | "EXECUTE" | "OBSERVE" | "CRITIQUE" | "IMPROVE";

export interface LayerTrace<T = unknown> {
  layer: LayerName;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  output: T;
  error?: string;
}

export interface MetaLoopConfig<TInput, TOutput> {
  /** Decompose input into ordered sub-steps */
  plan: (input: TInput) => Promise<string[]>;
  /** Execute the planned steps and return raw result */
  execute: (steps: string[], input: TInput) => Promise<TOutput>;
  /** Observe: extract metrics from the result */
  observe: (result: TOutput) => Promise<Record<string, unknown>>;
  /** Critique: score 0‥1 and surface issues */
  critique: (metrics: Record<string, unknown>) => Promise<{ score: number; issues: string[] }>;
  /** Improve: generate delta for next iteration (may be empty) */
  improve: (critique: { score: number; issues: string[] }) => Promise<string>;
}

export interface MetaLoopResult<TOutput> {
  output: TOutput;
  score: number;           // final self-score from CRITIQUE layer
  delta: string;           // improvement patch for next run
  traces: LayerTrace[];    // full audit trail across all 5 layers
  totalDurationMs: number;
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function runLayer<T>(
  name: LayerName,
  fn: () => Promise<T>
): Promise<LayerTrace<T>> {
  const startedAt = Date.now();
  try {
    const output = await fn();
    const completedAt = Date.now();
    return { layer: name, startedAt, completedAt, durationMs: completedAt - startedAt, output };
  } catch (err) {
    const completedAt = Date.now();
    return {
      layer: name,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      output: null as T,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * runMetaLoop — execute the full 5-layer loop for a given task.
 *
 * @param input  The raw task input
 * @param config Per-task layer implementations
 * @returns      Full result including score, delta, and audit traces
 */
export async function runMetaLoop<TInput, TOutput>(
  input: TInput,
  config: MetaLoopConfig<TInput, TOutput>
): Promise<MetaLoopResult<TOutput>> {
  const traces: LayerTrace[] = [];
  const loopStart = Date.now();

  // Layer 1: PLAN
  const planTrace = await runLayer("PLAN", () => config.plan(input));
  traces.push(planTrace as LayerTrace);
  const steps = planTrace.error ? [] : (planTrace.output as string[]);

  // Layer 2: EXECUTE
  const execTrace = await runLayer("EXECUTE", () => config.execute(steps, input));
  traces.push(execTrace as LayerTrace);
  const rawOutput = execTrace.output as TOutput;

  // Layer 3: OBSERVE
  const obsTrace = await runLayer("OBSERVE", () => config.observe(rawOutput));
  traces.push(obsTrace as LayerTrace);
  const metrics = obsTrace.output as Record<string, unknown>;

  // Layer 4: CRITIQUE
  const critiqueTrace = await runLayer("CRITIQUE", () => config.critique(metrics));
  traces.push(critiqueTrace as LayerTrace);
  const critiqueResult = critiqueTrace.output as { score: number; issues: string[] };

  // Layer 5: IMPROVE
  const improveTrace = await runLayer("IMPROVE", () => config.improve(critiqueResult));
  traces.push(improveTrace as LayerTrace);
  const delta = improveTrace.output as string;

  return {
    output: rawOutput,
    score: critiqueResult?.score ?? 0,
    delta,
    traces,
    totalDurationMs: Date.now() - loopStart,
  };
}

// ─── Default no-op implementations (override per task) ────────────────────────

export const defaultPlan = async (input: unknown): Promise<string[]> => [
  `Process: ${JSON.stringify(input).slice(0, 80)}`,
];

export const defaultObserve = async (
  result: unknown
): Promise<Record<string, unknown>> => ({
  resultType: typeof result,
  hasValue: result !== null && result !== undefined,
  timestamp: Date.now(),
});

export const defaultCritique = async (
  metrics: Record<string, unknown>
): Promise<{ score: number; issues: string[] }> => ({
  score: metrics.hasValue ? 0.8 : 0.2,
  issues: metrics.hasValue ? [] : ["No output produced"],
});

export const defaultImprove = async (critique: {
  score: number;
  issues: string[];
}): Promise<string> =>
  critique.issues.length === 0
    ? ""
    : `Fix required: ${critique.issues.join("; ")}`;
