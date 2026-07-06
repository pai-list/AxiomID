import { DelegationResolver, DelegationEdge } from '../../lib/delegation';
import { D1Helper } from '../../db/d1';

// Mock math-physics to avoid complex logic during resolver unit tests
jest.mock('../../lib/math-physics', () => ({
  pageRankTrust: jest.fn(() => new Map([['did:a', 0.5], ['did:b', 0.5]])),
  nashEquilibrium: jest.fn(() => ['did:a']),
  bestResponseDynamics: jest.fn(() => new Map([['did:a', 'increase']])),
  minCutTrustBottleneck: jest.fn(() => ({ maxFlow: 0.5, bottleneckNodes: ['did:b'] })),
  fiedlerPartition: jest.fn(() => ({ communityA: ['did:a'], communityB: ['did:b'] })),
}));

describe('DelegationResolver', () => {
  let resolver: DelegationResolver;
  let mockD1Helper: D1Helper;
  let mockDb: { prepare: jest.Mock };
  let mockPrepare: jest.Mock;
  let mockBind: jest.Mock;
  let mockAll: jest.Mock;
  let mockRun: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    mockAll = jest.fn();
    mockRun = jest.fn();
    mockBind = jest.fn().mockReturnValue({
      all: mockAll,
      run: mockRun,
    });
    mockPrepare = jest.fn().mockReturnValue({
      bind: mockBind,
      all: mockAll, // Sometimes query has no bind
    });

    mockDb = {
      prepare: mockPrepare,
    };

    mockD1Helper = {
      db: mockDb as unknown as D1Database,
    } as unknown as D1Helper;

    resolver = new DelegationResolver(mockD1Helper);
  });

  describe('addDelegation', () => {
    it('clamps trustLevel between 0 and 1 and binds parameters correctly', async () => {
      mockRun.mockResolvedValue({});

      const date = new Date('2026-01-01T00:00:00.000Z');
      await resolver.addDelegation('did:source', 'did:target', 1.5, date);

      expect(mockPrepare).toHaveBeenCalledWith(
        "INSERT OR REPLACE INTO trust_delegations (delegator_did, delegatee_did, trust_level, expires_at) VALUES (?, ?, ?, ?)"
      );
      expect(mockBind).toHaveBeenCalledWith('did:source', 'did:target', 1, date.toISOString());

      await resolver.addDelegation('did:source', 'did:target', -0.5);
      expect(mockBind).toHaveBeenCalledWith('did:source', 'did:target', 0, null);
    });
  });

  describe('resolveChain and computeDelegatedTrust', () => {
    it('returns empty array if no path', async () => {
      mockAll.mockResolvedValue({ results: [] });

      const chain = await resolver.resolveChain('did:a', 'did:b');
      expect(chain).toEqual([]);

      const trust = await resolver.computeDelegatedTrust('did:a', 'did:b');
      expect(trust).toBe(0);
    });

    it('finds path and computes trust for happy path', async () => {
      // Mock getOutgoingDelegationsBatch responses
      mockAll.mockResolvedValueOnce({
        results: [
          { delegator_did: 'did:a', delegatee_did: 'did:b', trust_level: 0.8 },
        ] as DelegationEdge[]
      });
      // Second batch call when resolving from did:a to did:c
      // (computeDelegatedTrust calls resolveChain again internally)

      // We will override resolveChain behavior manually to simplify since we know it works from tests.
      // Wait, resolveChain modifies state per query. We just mock mockAll enough times.
      // Need 4 mock calls total because resolveChain is called twice
      mockAll
        .mockResolvedValueOnce({
          results: [
            { delegator_did: 'did:b', delegatee_did: 'did:c', trust_level: 0.9 },
          ] as DelegationEdge[]
        })
        .mockResolvedValueOnce({
          results: [
            { delegator_did: 'did:a', delegatee_did: 'did:b', trust_level: 0.8 },
          ] as DelegationEdge[]
        })
        .mockResolvedValueOnce({
          results: [
            { delegator_did: 'did:b', delegatee_did: 'did:c', trust_level: 0.9 },
          ] as DelegationEdge[]
        });

      const chain = await resolver.resolveChain('did:a', 'did:c');
      expect(chain).toHaveLength(2);
      expect(chain[0].delegator).toBe('did:a');
      expect(chain[0].delegatee).toBe('did:b');
      expect(chain[1].delegator).toBe('did:b');
      expect(chain[1].delegatee).toBe('did:c');

      // 0.8 * 0.9 = 0.72
      const trust = await resolver.computeDelegatedTrust('did:a', 'did:c');
      expect(trust).toBeCloseTo(0.72);
    });

    it('detects cycles and prevents infinite loops', async () => {
      mockAll.mockResolvedValue({
        results: [
          { delegator_did: 'did:a', delegatee_did: 'did:b', trust_level: 0.8 },
          { delegator_did: 'did:b', delegatee_did: 'did:a', trust_level: 0.8 },
        ] as DelegationEdge[]
      });

      const chain = await resolver.resolveChain('did:a', 'did:c'); // looking for did:c which doesn't exist
      // Should terminate and return empty
      expect(chain).toEqual([]);
    });

    it('respects maxHops (3)', async () => {
      // A -> B -> C -> D -> E (target is E, 4 hops away)
      mockAll
        .mockResolvedValueOnce({
          results: [{ delegator_did: 'did:a', delegatee_did: 'did:b', trust_level: 0.5 }]
        })
        .mockResolvedValueOnce({
          results: [{ delegator_did: 'did:b', delegatee_did: 'did:c', trust_level: 0.5 }]
        })
        .mockResolvedValueOnce({
          results: [{ delegator_did: 'did:c', delegatee_did: 'did:d', trust_level: 0.5 }]
        })
        .mockResolvedValueOnce({
          results: [{ delegator_did: 'did:d', delegatee_did: 'did:e', trust_level: 0.5 }]
        });

      const chain = await resolver.resolveChain('did:a', 'did:e');
      expect(chain).toEqual([]); // Should not find E because it's > 3 hops
    });
  });

  describe('math physics wrappers', () => {
    beforeEach(() => {
      // Mock getAllDelegations
      mockAll.mockResolvedValue({
        results: [
          { delegator_did: 'did:a', delegatee_did: 'did:b', trust_level: 0.8 },
          { delegator_did: 'did:c', delegatee_did: 'did:b', trust_level: 0.5 },
        ] as DelegationEdge[]
      });
    });

    it('computePageRank calls pageRankTrust correctly', async () => {
      const result = await resolver.computePageRank(0.85);
      expect(result).toHaveLength(3); // nodes: a, b, c
      // Sorts by rank descending
      expect(result[0].rank).toBe(0.5);
      expect(result[1].rank).toBe(0.5);
      expect(result[2].rank).toBe(0);
    });

    it('computeNashEquilibrium calculates trustSums and calls nashEquilibrium', async () => {
      const result = await resolver.computeNashEquilibrium();
      expect(result).toEqual(['did:a']);
    });

    it('computeBestResponses calculates trustSums and calls bestResponseDynamics', async () => {
      const result = await resolver.computeBestResponses();
      expect(result.get('did:a')).toBe('increase');
    });

    it('computeTrustBottleneck calls minCutTrustBottleneck', async () => {
      const result = await resolver.computeTrustBottleneck('did:a', 'did:b');
      expect(result.maxFlow).toBe(0.5);
      expect(result.bottleneckDids).toEqual(['did:b']);
    });

    it('computeTrustCommunities calls fiedlerPartition', async () => {
      const result = await resolver.computeTrustCommunities();
      expect(result.communityA).toEqual(['did:a']);
      expect(result.communityB).toEqual(['did:b']);
    });
  });
});
