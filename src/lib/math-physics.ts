/**
 * math-physics.ts — Essential math and physics algorithms for AxiomID.
 * Refactored to follow ponytail guidelines: Keep it simple, delete dead code.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LEAKY BUCKET (Fluid Dynamics)
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeakyBucketConfig {
  capacity: number;
  drainRate: number;
  inflowRate: number;
}

export interface LeakyBucketState {
  level: number;
  lastDrain: number;
  overflowCount: number;
}

export function leakyBucketCheck(
  state: LeakyBucketState,
  config: LeakyBucketConfig,
  now: number = Date.now(),
): { allowed: boolean; newState: LeakyBucketState; waitTimeMs: number } {
  // ponytail: Simplified the calculation
  const elapsed = (now - state.lastDrain) / 1000;
  const level = Math.max(0, state.level - elapsed * config.drainRate);

  if (level + config.inflowRate <= config.capacity) {
    return {
      allowed: true,
      newState: { level: level + config.inflowRate, lastDrain: now, overflowCount: state.overflowCount },
      waitTimeMs: 0
    };
  }

  return {
    allowed: false,
    newState: { level, lastDrain: now, overflowCount: state.overflowCount + 1 },
    waitTimeMs: ((level + config.inflowRate - config.capacity) / config.drainRate) * 1000
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPONENTIAL BACKOFF (Radioactive Decay)
// ═══════════════════════════════════════════════════════════════════════════════

export function exponentialBackoff(
  attempt: number,
  baseMs: number = 1000,
  maxMs: number = 30000,
  jitter: boolean = true
): number {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  // ponytail: simplified jitter
  return jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHANNON ENTROPY (Information Theory)
// ═══════════════════════════════════════════════════════════════════════════════

export function shannonEntropy(data: string): number {
  if (!data) return 0;
  const counts = Array.from(data).reduce((acc, char) => {
    acc[char] = (acc[char] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.values(counts).reduce((entropy, count) => {
    const p = count / data.length;
    return entropy - (p * Math.log2(p));
  }, 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FRESHNESS (Thermodynamics / Decay)
// ═══════════════════════════════════════════════════════════════════════════════

export function dataFreshness(
  timestamp: number,
  halfLifeMs: number = 3600000, // 1 hour
  now: number = Date.now()
): number {
  if (timestamp >= now) return 1.0;
  const elapsed = now - timestamp;
  return Math.pow(0.5, elapsed / halfLifeMs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDEAL GAS LAW
// ═══════════════════════════════════════════════════════════════════════════════

export function idealGasPressure(n: number, v: number, t: number, r: number = 1): number {
  if (v <= 0) return Infinity;
  return (n * r * t) / v;
}
