import {
  derivePiDid,
  validateAccessToken,
  verifyPiAccessToken,
  createDidAssertion,
  PiUser,
} from "./agentScript";

describe("Pi Auth Bridge Skill", () => {
  // ─── derivePiDid ──────────────────────────────────────────────────────

  describe("derivePiDid", () => {
    it("creates correct DID format", () => {
      expect(derivePiDid("user123")).toBe("did:axiom:pi:user123");
    });

    it("URL-encodes special characters", () => {
      expect(derivePiDid("a b/c")).toBe("did:axiom:pi:a%20b%2Fc");
    });

    it("preserves alphanumeric characters", () => {
      expect(derivePiDid("abc-123_DEF")).toBe("did:axiom:pi:abc-123_DEF");
    });
  });

  // ─── validateAccessToken ──────────────────────────────────────────────

  describe("validateAccessToken", () => {
    it("accepts a valid token", () => {
      const result = validateAccessToken("valid-token-abc");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects empty token", () => {
      const result = validateAccessToken("");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("accepts whitespace-only token (min length 1)", () => {
      const result = validateAccessToken("   ");
      expect(result.valid).toBe(true);
    });
  });

  // ─── verifyPiAccessToken ──────────────────────────────────────────────

  describe("verifyPiAccessToken", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns user on valid token", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ uid: "pi-123", username: "testuser" }),
      });

      const user = await verifyPiAccessToken("valid-token");
      expect(user).toEqual({ uid: "pi-123", username: "testuser" });
    });

    it("returns null on invalid token", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const user = await verifyPiAccessToken("bad-token");
      expect(user).toBeNull();
    });

    it("returns null on network error", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

      const user = await verifyPiAccessToken("token");
      expect(user).toBeNull();
    });

    it("returns null on empty token", async () => {
      const user = await verifyPiAccessToken("");
      expect(user).toBeNull();
    });

    it("returns null when the API response body is not valid JSON", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("invalid json");
        },
      });

      const user = await verifyPiAccessToken("token-with-bad-body");
      expect(user).toBeNull();
    });

    it("returns null when the API response does not match the PiUser schema", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ username: "missing-uid-field" }),
      });

      const user = await verifyPiAccessToken("token");
      expect(user).toBeNull();
    });

    it("uses the provided piApiBase when calling the Pi API", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ uid: "pi-789" }),
      });
      global.fetch = fetchMock;

      await verifyPiAccessToken("token", "https://custom.pi.example");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://custom.pi.example/v2/me",
        expect.objectContaining({ headers: { Authorization: "Key token" } })
      );
    });
  });

  // ─── createDidAssertion ───────────────────────────────────────────────

  describe("createDidAssertion", () => {
    const mockUser: PiUser = { uid: "pi-456", username: "alice" };

    it("creates assertion with correct DID", () => {
      const assertion = createDidAssertion(mockUser);
      expect(assertion.did).toBe("did:axiom:pi:pi-456");
    });

    it("defaults to read+write scopes", () => {
      const assertion = createDidAssertion(mockUser);
      expect(assertion.scopes).toEqual(["api.read", "api.write"]);
    });

    it("uses custom scopes when provided", () => {
      const assertion = createDidAssertion(mockUser, ["api.read"]);
      expect(assertion.scopes).toEqual(["api.read"]);
    });

    it("sets issuedAt to current time", () => {
      const before = Math.floor(Date.now() / 1000);
      const assertion = createDidAssertion(mockUser);
      const after = Math.floor(Date.now() / 1000);

      expect(assertion.issuedAt).toBeGreaterThanOrEqual(before);
      expect(assertion.issuedAt).toBeLessThanOrEqual(after);
    });

    it("sets expiresAt 1 hour after issuedAt", () => {
      const assertion = createDidAssertion(mockUser);
      expect(assertion.expiresAt).toBe(assertion.issuedAt + 3600);
    });
  });
});
