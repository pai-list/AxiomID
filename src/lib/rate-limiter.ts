/**
 * rate-limiter.ts — Distributed rate limiter backed by Upstash Redis.
 *
 * Uses a sliding-window counter via Redis INCR + EXPIRE so counts survive
 * cold starts and horizontal scale-out (Vercel Edge / Lambda).
 *
 * Falls back to allow-all (with a warning) when UPSTASH_REDIS_REST_URL is
 * not set, so local dev without a Redis instance keeps working.
 */

import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis client (lazy singleton — constructed once per cold start)
// ---------------------------------------------------------------------------
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Warn once per cold start; allow-all in dev.
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[rate-limiter] UPSTASH_REDIS_REST_URL / TOKEN not set — " +
          "rate limiting is DISABLED. Set them in .env for production."
      );
    }
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ---------------------------------------------------------------------------
// Public types & constants
// ---------------------------------------------------------------------------
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  anonymous:     { windowMs: 60_000, maxRequests: 30  },
  authenticated: { windowMs: 60_000, maxRequests: 100 },
  piAuth:        { windowMs: 60_000, maxRequests: 5   },
  payment:       { windowMs: 60_000, maxRequests: 10  },
} as const satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  allowed:  boolean;
  remaining: number;
  resetAt:  number;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------
/**
 * Increments the request counter for `key` inside a sliding window.
 *
 * @param key       Unique identifier (e.g. `"rl:anon:<ip>"`)
 * @param config    Window size and max request count
 * @returns         `{ allowed, remaining, resetAt }`
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowSec = Math.ceil(config.windowMs / 1_000);
  const now       = Date.now();
  const resetAt   = now + config.windowMs;

  // ── Fallback: no Redis ──────────────────────────────────────────────────
  if (!redis) {
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // ── Sliding window via INCR + EXPIRE (atomic on the same key) ──────────
  const redisKey = `rl:${key}`;

  // Lua script guarantees INCR + conditional EXPIRE are atomic.
  // Returns the NEW counter value after increment.
  const count = await redis.eval(
    `local c = redis.call('INCR', KEYS[1])
     if c == 1 then
       redis.call('EXPIRE', KEYS[1], ARGV[1])
     end
     return c`,
    [redisKey],
    [String(windowSec)]
  ) as unknown as number;

  const allowed   = count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - count);

  return { allowed, remaining, resetAt };
}
