/**
 * math-physics.ts — Physics-inspired algorithms for AxiomID.
 *
 * Leverages mathematical and physical principles:
 * - Leaky Bucket (fluid dynamics) for rate limiting
 * - Exponential backoff (radioactive decay) for retry logic
 * - Shannon entropy (information theory) for data freshness
 * - Ideal Gas Law for request pressure
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LEAKY BUCKET (Fluid Dynamics)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Leaky Bucket algorithm — models requests as water flowing into a bucket.
 * Water (requests) flows in at rate `inflowRate`, leaks out at `drainRate`.
 * If bucket overflows (exceeds capacity), requests are rejected.
 *
 * Physics analogy: Water pressure builds up when inflow > drain.
 */
export interface LeakyBucketConfig {
  capacity: number;        // Maximum bucket size (requests)
  drainRate: number;       // Requests drained per second
  inflowRate: number;      // Requests allowed per second
}

export interface LeakyBucketState {
  level: number;           // Current water level (queued requests)
  lastDrain: number;       // Last drain timestamp (ms)
  overflowCount: number;   // Number of times bucket overflowed
}

export function leakyBucketCheck(
  state: LeakyBucketState,
  config: LeakyBucketConfig,
  now: number = Date.now(),
): { allowed: boolean; newState: LeakyBucketState; waitTimeMs: number } {
  const elapsed = (now - state.lastDrain) / 1000; // seconds

  // Drain water (leak) — exponential decay: level = level * e^(-λt)
  // where λ = drainRate / capacity
  const lambda = config.drainRate / config.capacity;
  const drainedLevel = state.level * Math.exp(-lambda * elapsed);

  // Add new request (inflow)
  const newLevel = drainedLevel + 1;

  if (newLevel > config.capacity) {
    // Bucket overflow — calculate wait time for drain
    // Solve: capacity = level * e^(-λt) for t
    // t = -ln(capacity / level) / λ
    const waitTimeMs = Math.ceil(-Math.log(config.capacity / drainedLevel) / lambda * 1000);

    return {
      allowed: false,
      newState: {
        ...state,
        level: Math.min(newLevel, config.capacity),
        overflowCount: state.overflowCount + 1,
      },
      waitTimeMs,
    };
  }

  return {
    allowed: true,
    newState: {
      level: newLevel,
      lastDrain: now,
      overflowCount: state.overflowCount,
    },
    waitTimeMs: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPONENTIAL BACKOFF (Radioactive Decay)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate retry delay using exponential backoff.
 *
 * Physics analogy: Radioactive decay — N(t) = N0 * e^(-λt)
 * Each retry doubles the delay, with jitter to prevent thundering herd.
 */
export function exponentialBackoff(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000,
  jitterFactor: number = 0.3,
): number {
  // Exponential decay: delay = base * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Add jitter: random offset to prevent synchronization
  const jitter = exponentialDelay * jitterFactor * (Math.random() * 2 - 1);

  // Clamp to max delay
  return Math.min(maxDelayMs, Math.max(0, exponentialDelay + jitter));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHANNON ENTROPY (Information Theory)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shannon entropy — measures information content / uncertainty.
 *
 * Physics analogy: Thermodynamic entropy S = -k * Σ(p * ln(p))
 * Higher entropy = more random = fresher data.
 */
export function shannonEntropy(data: string): number {
  if (data.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const char of data) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / data.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Data freshness score based on entropy and time decay.
 *
 * Physics analogy: Radioactive decay + entropy
 * freshness = entropy * e^(-λt)
 * where λ = decay constant, t = time since creation
 */
export function dataFreshness(
  createdAt: number,
  now: number = Date.now(),
  decayConstant: number = 0.001,
  entropyBonus: number = 0,
): number {
  const ageMs = now - createdAt;
  const timeDecay = Math.exp(-decayConstant * ageMs);
  return Math.min(1, timeDecay + entropyBonus * 0.1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDEAL GAS LAW (Thermodynamics)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ideal Gas Law pressure — request pressure on the system.
 *
 * Physics analogy: PV = nRT → P = nRT / V
 * Higher pressure = more requests per capacity = more stress.
 */
export function idealGasPressure(
  activeRequests: number,
  capacity: number,
  temperature: number,
  gasConstant: number = 1,
): number {
  if (capacity <= 0) return Infinity;
  return (activeRequests * gasConstant * temperature) / capacity;
}
