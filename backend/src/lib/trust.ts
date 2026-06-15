/**
 * Edge trust score computation.
 * XP (70%) + Stamps (30%) + Delegation bonus.
 */

import { KVHelper } from "../db/kv";

export interface TrustBreakdown {
  xp: number;
  stamps: number;
  delegation: number;
}

export interface TrustResult {
  did: string;
  score: number;
  breakdown: TrustBreakdown;
  cachedAt: number;
}

const TRUST_CACHE_TTL = 60; // seconds

export class TrustEngine {
  private kv: KVHelper;

  constructor(kv: KVHelper) {
    this.kv = kv;
  }

  async compute(did: string): Promise<TrustResult> {
    const cached = await this.kv.get<TrustResult>(`trust:${did}`);
    if (cached) return cached;

    // Base trust from DID ownership (always 0.1 for valid DID)
    const baseTrust = 0.1;

    // XP component (0-0.7): derived from Pi Network trust score
    const xpScore = 0.4; // placeholder — will be fetched from Pi API

    // Stamps component (0-0.3): community attestations
    const stampsScore = 0.2; // placeholder — will be computed from stamps

    // Delegation component: trust from delegated DIDs
    const delegationScore = 0;

    const score = Math.min(1, baseTrust + xpScore + stampsScore + delegationScore);

    const result: TrustResult = {
      did,
      score,
      breakdown: { xp: xpScore, stamps: stampsScore, delegation: delegationScore },
      cachedAt: Date.now(),
    };

    await this.kv.set(`trust:${did}`, result, TRUST_CACHE_TTL);
    return result;
  }

  async invalidate(did: string): Promise<void> {
    await this.kv.delete(`trust:${did}`);
  }
}
