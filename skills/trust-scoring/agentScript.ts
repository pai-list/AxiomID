import { z } from "zod";

// ─── Schema ──────────────────────────────────────────────────────────────────

const TOTAL_STAMPS = 10;

const TrustScoreParamsSchema = z.object({
  xp: z.number().int(),
  stampsClaimed: z.number().int(),
  tenureDays: z.number().int().optional(),
  semanticTrust: z.number().min(0).max(100).optional(),
});

export type TrustScoreParams = z.infer<typeof TrustScoreParamsSchema>;

export interface TrustScoreResult {
  score: number;
  components: {
    xpScore: number;
    stampScore: number;
    tenureScore: number | null;
    semanticScore: number | null;
  };
  breakdown: string;
}

// ─── Normalization ───────────────────────────────────────────────────────────

/**
 * Normalizes stamp count to a 0-100 score.
 */
export function normalizeStamps(count: number, total: number = TOTAL_STAMPS): number {
  const clamped = Math.max(0, Math.min(count, total));
  return total > 0 ? Math.round((clamped / total) * 100) : 0;
}

/**
 * Normalizes XP to a 0-100 score (10 XP = 1 point, max 100).
 */
export function normalizeXp(xp: number): number {
  return Math.min(100, Math.max(0, Math.floor((xp || 0) / 10)));
}

/**
 * Normalizes tenure days to a 0-100 score (50 days = 100%).
 */
export function normalizeTenure(days: number): number {
  return Math.min(100, Math.max(0, days * 2));
}

// ─── Trust Score Computation ─────────────────────────────────────────────────

/**
 * Computes a composite trust score with full component breakdown.
 *
 * Weighting:
 * - XP: 50% (or 70% in legacy mode)
 * - Stamps: 20% (or 30% in legacy mode)
 * - Tenure: 10% (legacy mode: 0%)
 * - Semantic: 20% (legacy mode: 0%)
 */
export function computeTrustScore(params: TrustScoreParams): TrustScoreResult {
  const validated = TrustScoreParamsSchema.parse(params);

  const xpScore = normalizeXp(validated.xp);
  const stampScore = normalizeStamps(validated.stampsClaimed);

  if (validated.tenureDays === undefined && validated.semanticTrust === undefined) {
    const score = Math.round(xpScore * 0.7 + stampScore * 0.3);
    return {
      score: Math.max(0, Math.min(100, score)),
      components: {
        xpScore,
        stampScore,
        tenureScore: null,
        semanticScore: null,
      },
      breakdown: `legacy: xp(${xpScore}) * 0.7 + stamps(${stampScore}) * 0.3 = ${score}`,
    };
  }

  const tenureScore = normalizeTenure(validated.tenureDays ?? 0);
  const semanticScore = validated.semanticTrust ?? 50;

  const score = Math.round(
    xpScore * 0.5 + stampScore * 0.2 + tenureScore * 0.1 + semanticScore * 0.2
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    components: {
      xpScore,
      stampScore,
      tenureScore,
      semanticScore,
    },
    breakdown: `xp(${xpScore})*0.5 + stamps(${stampScore})*0.2 + tenure(${tenureScore})*0.1 + semantic(${semanticScore})*0.2 = ${score}`,
  };
}
