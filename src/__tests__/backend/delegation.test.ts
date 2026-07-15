/**
 * @jest-environment node
 */

import { DelegationResolver } from "../../../backend/src/lib/delegation";

describe("DelegationResolver — IDOR and Access Control Verification", () => {
  let mockD1: any;
  let resolver: DelegationResolver;

  const ADMIN_DID = "did:axiom:axiomid.app:admin";
  const USER_A_DID = "did:axiom:userA";
  const USER_B_DID = "did:axiom:userB";
  const USER_C_DID = "did:axiom:userC";

  beforeEach(() => {
    // Mock D1Helper database calls
    mockD1 = {
      db: {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnThis(),
          all: jest.fn().mockResolvedValue({
            results: [
              {
                id: 1,
                delegator_did: USER_A_DID,
                delegatee_did: USER_B_DID,
                trust_level: 0.8,
                created_at: "2026-01-01T00:00:00Z",
                expires_at: null,
              },
            ],
          }),
        }),
      },
    };

    resolver = new DelegationResolver(mockD1);
  });

  describe("Global Trust Computations (Admin-Only)", () => {
    it("allows computation of PageRank when caller is admin", async () => {
      const results = await resolver.computePageRank(0.85, ADMIN_DID);
      expect(Array.isArray(results)).toBe(true);
    });

    it("throws unauthorized error for PageRank when caller is a normal user", async () => {
      await expect(resolver.computePageRank(0.85, USER_A_DID)).rejects.toThrow(
        /Unauthorized: Global trust network computation is restricted to administrators/
      );
    });

    it("allows computation of Nash Equilibrium when caller is admin", async () => {
      const results = await resolver.computeNashEquilibrium(ADMIN_DID);
      expect(Array.isArray(results)).toBe(true);
    });

    it("throws unauthorized error for Nash Equilibrium when caller is a normal user", async () => {
      await expect(resolver.computeNashEquilibrium(USER_A_DID)).rejects.toThrow(
        /Unauthorized: Global trust network computation is restricted to administrators/
      );
    });

    it("allows computation of Best Responses when caller is admin", async () => {
      const results = await resolver.computeBestResponses(ADMIN_DID);
      expect(results).toBeInstanceOf(Map);
    });

    it("throws unauthorized error for Best Responses when caller is a normal user", async () => {
      await expect(resolver.computeBestResponses(USER_A_DID)).rejects.toThrow(
        /Unauthorized: Global trust network computation is restricted to administrators/
      );
    });

    it("allows computation of Trust Communities when caller is admin", async () => {
      const results = await resolver.computeTrustCommunities(ADMIN_DID);
      expect(results).toHaveProperty("communityA");
      expect(results).toHaveProperty("communityB");
    });

    it("throws unauthorized error for Trust Communities when caller is a normal user", async () => {
      await expect(resolver.computeTrustCommunities(USER_A_DID)).rejects.toThrow(
        /Unauthorized: Global trust network computation is restricted to administrators/
      );
    });
  });

  describe("Resolve Chain (IDOR Access Control)", () => {
    it("allows source user to resolve their own chain", async () => {
      const chain = await resolver.resolveChain(USER_A_DID, USER_B_DID, USER_A_DID);
      expect(Array.isArray(chain)).toBe(true);
    });

    it("allows target user to resolve their own chain", async () => {
      const chain = await resolver.resolveChain(USER_A_DID, USER_B_DID, USER_B_DID);
      expect(Array.isArray(chain)).toBe(true);
    });

    it("allows administrator to resolve any chain", async () => {
      const chain = await resolver.resolveChain(USER_A_DID, USER_B_DID, ADMIN_DID);
      expect(Array.isArray(chain)).toBe(true);
    });

    it("throws unauthorized error for unrelated user attempting to resolve chain (IDOR)", async () => {
      await expect(resolver.resolveChain(USER_A_DID, USER_B_DID, USER_C_DID)).rejects.toThrow(
        /Unauthorized: You can only resolve trust chains involving your own DID/
      );
    });
  });

  describe("Get Trusters (IDOR Access Control)", () => {
    it("allows delegatee to query their own truster list", async () => {
      const trusters = await resolver.getTrusters(USER_B_DID, USER_B_DID);
      expect(Array.isArray(trusters)).toBe(true);
    });

    it("allows administrator to query any truster list", async () => {
      const trusters = await resolver.getTrusters(USER_B_DID, ADMIN_DID);
      expect(Array.isArray(trusters)).toBe(true);
    });

    it("throws unauthorized error for unrelated user attempting to query trusters (IDOR)", async () => {
      await expect(resolver.getTrusters(USER_B_DID, USER_A_DID)).rejects.toThrow(
        /Unauthorized: Access to truster lists is restricted to the delegatee or admins/
      );
    });
  });
});
