/**
 * KV-backed rate limiter (distributed, replacing in-memory).
 * Sliding window counter stored in KV.
 */

import { KVHelper } from "../db/kv";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  anonymous: { windowMs: 60_000, maxRequests: 30 },
  authenticated: { windowMs: 60_000, maxRequests: 100 },
  piAuth: { windowMs: 60_000, maxRequests: 5 },
  payment: { windowMs: 60_000, maxRequests: 10 },
};

export class RateLimiter {
  private kv: KVHelper;

  constructor(kv: KVHelper) {
    this.kv = kv;
  }

  async check(
    key: string,
    tier: keyof typeof RATE_LIMITS = "anonymous"
  ): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
    const config = RATE_LIMITS[tier] || RATE_LIMITS.anonymous;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const rk = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;

    const existing = await this.kv.get<{ count: number; windowStart: number }>(rk);

    if (!existing || existing.windowStart < windowStart) {
      await this.kv.set(rk, { count: 1, windowStart: now }, Math.ceil(config.windowMs / 1000));
      return { allowed: true, remaining: config.maxRequests - 1, resetMs: config.windowMs };
    }

    if (existing.count >= config.maxRequests) {
      const resetMs = existing.windowStart + config.windowMs - now;
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    existing.count += 1;
    const ttl = Math.ceil((config.windowMs - (now - existing.windowStart)) / 1000);
    await this.kv.set(rk, existing, ttl);

    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetMs: config.windowMs - (now - existing.windowStart),
    };
  }
}
