/**
 * Trust delegation chain resolver.
 * BFS traversal with cycle detection, max 3 hops.
 */

import { D1Helper } from "../db/d1";

export interface DelegationEdge {
  delegator_did: string;
  delegatee_did: string;
  trust_level: number;
}

export interface TrustChain {
  delegator: string;
  delegatee: string;
  trustLevel: number;
  hop: number;
}

export class DelegationResolver {
  private d1: D1Helper;
  private maxHops = 3;

  constructor(d1: D1Helper) {
    this.d1 = d1;
  }

  /**
   * Resolve trust chain from source DID to target DID.
   * Uses BFS with cycle detection.
   */
  async resolveChain(sourceDid: string, targetDid: string): Promise<TrustChain[]> {
    const visited = new Set<string>();
    const queue: Array<{ did: string; chain: TrustChain[]; hop: number }> = [
      { did: sourceDid, chain: [], hop: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.did === targetDid && current.chain.length > 0) {
        return current.chain;
      }

      if (current.hop >= this.maxHops) continue;
      if (visited.has(current.did)) continue;
      visited.add(current.did);

      // Query D1 for outgoing delegations
      const delegations = await this.getOutgoingDelegations(current.did);

      for (const d of delegations) {
        if (!visited.has(d.delegatee_did)) {
          queue.push({
            did: d.delegatee_did,
            chain: [
              ...current.chain,
              {
                delegator: d.delegator_did,
                delegatee: d.delegatee_did,
                trustLevel: d.trust_level,
                hop: current.hop + 1,
              },
            ],
            hop: current.hop + 1,
          });
        }
      }
    }

    return [];
  }

  /**
   * Compute accumulated trust from delegation chain.
   * Returns product of trust levels along the path.
   */
  async computeDelegatedTrust(sourceDid: string, targetDid: string): Promise<number> {
    const chain = await this.resolveChain(sourceDid, targetDid);
    if (chain.length === 0) return 0;

    return chain.reduce((acc, edge) => acc * edge.trustLevel, 1);
  }

  /**
   * Get all outgoing delegations from a DID.
   */
  private async getOutgoingDelegations(did: string): Promise<DelegationEdge[]> {
    const result = await this.d1.db
      .prepare(
        "SELECT * FROM trust_delegations WHERE delegator_did = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
      )
      .bind(did)
      .all<DelegationEdge>();
    return result.results;
  }

  /**
   * Add a delegation edge.
   */
  async addDelegation(
    delegatorDid: string,
    delegateeDid: string,
    trustLevel: number,
    expiresAt?: Date
  ): Promise<void> {
    await this.d1.db
      .prepare(
        "INSERT OR REPLACE INTO trust_delegations (delegator_did, delegatee_did, trust_level, expires_at) VALUES (?, ?, ?, ?)"
      )
      .bind(
        delegatorDid,
        delegateeDid,
        Math.max(0, Math.min(1, trustLevel)),
        expiresAt?.toISOString() || null
      )
      .run();
  }

  /**
   * Get all DIDs that trust a given DID (incoming delegations).
   */
  async getTrusters(delegateeDid: string): Promise<DelegationEdge[]> {
    const result = await this.d1.db
      .prepare(
        "SELECT * FROM trust_delegations WHERE delegatee_did = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
      )
      .bind(delegateeDid)
      .all<DelegationEdge>();
    return result.results;
  }
}
