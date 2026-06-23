/**
 * @jest-environment node
 */

import {
  deriveSovereignAgentKeypair,
  signPayloadWithAgentKey,
  deriveUserRootKey,
  verifyAgentSignature,
  ROOT_AGENT_ID,
} from "@/lib/sovereign-keys";

describe("sovereign-keys", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("ROOT_AGENT_ID", () => {
    it("is re-exported as 'axiom-root'", () => {
      expect(ROOT_AGENT_ID).toBe("axiom-root");
    });
  });

  describe("deriveSovereignAgentKeypair", () => {
    it("returns PEM-encoded public and private keys", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
      expect(keys.privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("is deterministic — same inputs produce same keys", () => {
      const keys1 = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const keys2 = deriveSovereignAgentKeypair("GABC123", "agent-1");
      expect(keys1.publicKey).toBe(keys2.publicKey);
      expect(keys1.privateKey).toBe(keys2.privateKey);
    });

    it("produces different keys for different addresses", () => {
      const keys1 = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const keys2 = deriveSovereignAgentKeypair("GDEF456", "agent-1");
      expect(keys1.publicKey).not.toBe(keys2.publicKey);
    });

    it("produces different keys for different agent IDs", () => {
      const keys1 = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const keys2 = deriveSovereignAgentKeypair("GABC123", "agent-2");
      expect(keys1.publicKey).not.toBe(keys2.publicKey);
    });

    it("uses SOVEREIGN_KEY_SALT env var when set", () => {
      process.env.SOVEREIGN_KEY_SALT = "custom-test-salt";
      const keys1 = deriveSovereignAgentKeypair("GABC123", "agent-1");

      process.env.SOVEREIGN_KEY_SALT = "different-test-salt";
      const keys2 = deriveSovereignAgentKeypair("GABC123", "agent-1");

      expect(keys1.publicKey).not.toBe(keys2.publicKey);
    });

    it("uses SOVEREIGN_KEY_SALT when set, distinct from the dev fallback", () => {
      delete process.env.SOVEREIGN_KEY_SALT;
      process.env.NODE_ENV = "test";
      const fallbackKeys = deriveSovereignAgentKeypair("GABC123", "agent-1");

      process.env.SOVEREIGN_KEY_SALT = "custom-override-salt";
      const customKeys = deriveSovereignAgentKeypair("GABC123", "agent-1");

      expect(fallbackKeys.publicKey).not.toBe(customKeys.publicKey);
    });

    it("throws in production when SOVEREIGN_KEY_SALT is not set", () => {
      delete process.env.SOVEREIGN_KEY_SALT;
      process.env.NODE_ENV = "production";
      expect(() => deriveSovereignAgentKeypair("GABC123", "agent-1")).toThrow(
        "SOVEREIGN_KEY_SALT is not configured"
      );
    });

    it("uses fallback salt in non-production without SOVEREIGN_KEY_SALT", () => {
      delete process.env.SOVEREIGN_KEY_SALT;
      process.env.NODE_ENV = "test";
      // Should not throw
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
    });
  });

  describe("signPayloadWithAgentKey + verifyAgentSignature", () => {
    it("signs and verifies a payload", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const payload = "hello sovereign";
      const sig = signPayloadWithAgentKey(payload, keys.privateKey);
      expect(typeof sig).toBe("string");
      expect(sig.length).toBeGreaterThan(0);
      expect(verifyAgentSignature(payload, sig, keys.publicKey)).toBe(true);
    });

    it("signature is hex-encoded", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const sig = signPayloadWithAgentKey("payload", keys.privateKey);
      expect(sig).toMatch(/^[0-9a-f]+$/);
    });

    it("rejects a tampered payload", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const sig = signPayloadWithAgentKey("original payload", keys.privateKey);
      expect(verifyAgentSignature("modified payload", sig, keys.publicKey)).toBe(false);
    });

    it("rejects a signature from the wrong key", () => {
      const keys1 = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const keys2 = deriveSovereignAgentKeypair("GDEF456", "agent-2");
      const sig = signPayloadWithAgentKey("hello", keys1.privateKey);
      expect(verifyAgentSignature("hello", sig, keys2.publicKey)).toBe(false);
    });

    it("rejects a garbage signature", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      expect(verifyAgentSignature("hello", "deadbeef".repeat(16), keys.publicKey)).toBe(false);
    });

    it("signs an empty string payload", () => {
      const keys = deriveSovereignAgentKeypair("GABC123", "agent-1");
      const sig = signPayloadWithAgentKey("", keys.privateKey);
      expect(verifyAgentSignature("", sig, keys.publicKey)).toBe(true);
    });
  });

  describe("deriveUserRootKey", () => {
    it("returns PEM-encoded keys", () => {
      const keys = deriveUserRootKey("user-abc");
      expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
      expect(keys.privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("is deterministic", () => {
      const keys1 = deriveUserRootKey("user-abc");
      const keys2 = deriveUserRootKey("user-abc");
      expect(keys1.publicKey).toBe(keys2.publicKey);
    });

    it("produces different keys for different user IDs", () => {
      const keys1 = deriveUserRootKey("user-abc");
      const keys2 = deriveUserRootKey("user-xyz");
      expect(keys1.publicKey).not.toBe(keys2.publicKey);
    });

    it("result matches deriveSovereignAgentKeypair with ROOT_AGENT_ID", () => {
      const rootKeys = deriveUserRootKey("user-abc");
      const agentKeys = deriveSovereignAgentKeypair("user-abc", ROOT_AGENT_ID);
      expect(rootKeys.publicKey).toBe(agentKeys.publicKey);
      expect(rootKeys.privateKey).toBe(agentKeys.privateKey);
    });

    it("throws in production when SOVEREIGN_KEY_SALT is not set", () => {
      delete process.env.SOVEREIGN_KEY_SALT;
      process.env.NODE_ENV = "production";
      expect(() => deriveUserRootKey("user-abc")).toThrow(
        "SOVEREIGN_KEY_SALT is not configured"
      );
    });

    it("uses fallback salt in non-production", () => {
      delete process.env.SOVEREIGN_KEY_SALT;
      process.env.NODE_ENV = "test";
      const keys = deriveUserRootKey("user-abc");
      expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
    });
  });
});