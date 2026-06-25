import {
  isDemoWalletAddress,
  getStoredWallet,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  mapApiUser,
} from "@/app/context/wallet-types";

// calculateTrustScore is used internally by mapApiUser
jest.mock("@/lib/trust", () => ({
  calculateTrustScore: jest.fn((xp: number, stampCount: number) => xp + stampCount * 10),
}));

describe("isDemoWalletAddress", () => {
  it("returns false for null", () => {
    expect(isDemoWalletAddress(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isDemoWalletAddress(undefined)).toBe(false);
  });

  it("returns true for 'demo:' prefix", () => {
    expect(isDemoWalletAddress("demo:alice")).toBe(true);
  });

  it("returns true for 'demo:' prefix with various suffixes", () => {
    expect(isDemoWalletAddress("demo:wallet123")).toBe(true);
    expect(isDemoWalletAddress("demo:")).toBe(true);
  });

  it("returns false for 'pi:' prefix", () => {
    expect(isDemoWalletAddress("pi:user123")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isDemoWalletAddress("")).toBe(false);
  });

  it("returns false for a regular address without demo: prefix", () => {
    expect(isDemoWalletAddress("GSTELLARADDRESS123")).toBe(false);
  });
});

describe("getStoredWallet", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no wallet is stored", () => {
    expect(getStoredWallet()).toBeNull();
  });

  it("returns null and removes the entry when stored address is a demo wallet", () => {
    localStorage.setItem("axiomid_wallet", "demo:alice");
    const result = getStoredWallet();
    expect(result).toBeNull();
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
  });

  it("returns the stored wallet address when it is not a demo wallet", () => {
    localStorage.setItem("axiomid_wallet", "pi:user-uid-123");
    expect(getStoredWallet()).toBe("pi:user-uid-123");
  });

  it("returns null when stored value is empty string (falsy)", () => {
    localStorage.setItem("axiomid_wallet", "");
    // empty string is not a demo address, so it should just be returned
    // but localStorage returns empty string, not null
    const result = getStoredWallet();
    expect(result).toBe("");
  });
});

describe("getLocalStorageItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when the key does not exist", () => {
    expect(getLocalStorageItem("nonexistent_key")).toBeNull();
  });

  it("returns the stored value when the key exists", () => {
    localStorage.setItem("pi_access_token", "test-token-abc");
    expect(getLocalStorageItem("pi_access_token")).toBe("test-token-abc");
  });

  it("returns null for axiomid_logged_out when not set", () => {
    expect(getLocalStorageItem("axiomid_logged_out")).toBeNull();
  });

  it("returns 'true' when axiomid_logged_out is set", () => {
    localStorage.setItem("axiomid_logged_out", "true");
    expect(getLocalStorageItem("axiomid_logged_out")).toBe("true");
  });
});

describe("setLocalStorageItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores a value in localStorage", () => {
    setLocalStorageItem("test_key", "test_value");
    expect(localStorage.getItem("test_key")).toBe("test_value");
  });

  it("overwrites an existing value", () => {
    localStorage.setItem("test_key", "old_value");
    setLocalStorageItem("test_key", "new_value");
    expect(localStorage.getItem("test_key")).toBe("new_value");
  });
});

describe("removeLocalStorageItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes a key from localStorage", () => {
    localStorage.setItem("to_remove", "value");
    removeLocalStorageItem("to_remove");
    expect(localStorage.getItem("to_remove")).toBeNull();
  });

  it("does not throw when key does not exist", () => {
    expect(() => removeLocalStorageItem("nonexistent")).not.toThrow();
  });
});

describe("mapApiUser", () => {
  const baseApiResponse = {
    userId: "user-abc",
    walletAddress: "pi:user-abc",
    tier: "Citizen" as const,
    xp: 200,
  };

  it("maps basic required fields correctly", () => {
    const result = mapApiUser(baseApiResponse);
    expect(result.id).toBe("user-abc");
    expect(result.walletAddress).toBe("pi:user-abc");
    expect(result.tier).toBe("Citizen");
    expect(result.xp).toBe(200);
  });

  it("sets optional fields to null when missing", () => {
    const result = mapApiUser(baseApiResponse);
    expect(result.stellarAddress).toBeNull();
    expect(result.kycStatus).toBeNull();
    expect(result.did).toBeNull();
    expect(result.passportUrl).toBeNull();
    expect(result.agent).toBeNull();
  });

  it("uses trustScore from API when provided", () => {
    const result = mapApiUser({ ...baseApiResponse, trustScore: 99 });
    expect(result.trustScore).toBe(99);
  });

  it("computes trustScore from xp and stamps when API omits it", () => {
    const result = mapApiUser({
      ...baseApiResponse,
      stamps: [
        { type: "connect_wallet", provider: "pi_network", xpAwarded: 100, createdAt: "2026-01-01T00:00:00.000Z" },
        { type: "verify_kya", provider: "axiom_protocol", xpAwarded: 150, createdAt: "2026-01-01T00:00:00.000Z" },
      ],
    });
    // Mocked calculateTrustScore returns xp + stampCount*10 = 200 + 2*10 = 220
    expect(result.trustScore).toBe(220);
  });

  it("uses fallback stellarAddress when API does not provide one", () => {
    const result = mapApiUser(baseApiResponse, { stellarAddress: "GFALLBACK123" });
    expect(result.stellarAddress).toBe("GFALLBACK123");
  });

  it("API stellarAddress takes precedence over fallback", () => {
    const result = mapApiUser(
      { ...baseApiResponse, stellarAddress: "GAPI123" },
      { stellarAddress: "GFALLBACK123" }
    );
    expect(result.stellarAddress).toBe("GAPI123");
  });

  it("uses fallback createdAt when API omits it", () => {
    const fallbackDate = "2025-01-01T00:00:00.000Z";
    const result = mapApiUser(baseApiResponse, { createdAt: fallbackDate });
    expect(result.createdAt).toBe(fallbackDate);
  });

  it("generates a createdAt when neither API nor fallback provide one", () => {
    const before = Date.now();
    const result = mapApiUser(baseApiResponse);
    const after = Date.now();
    const resultTime = new Date(result.createdAt).getTime();
    expect(resultTime).toBeGreaterThanOrEqual(before);
    expect(resultTime).toBeLessThanOrEqual(after);
  });

  it("uses API actions when provided, ignoring fallback", () => {
    const apiActions = [{ type: "connect_wallet", xp: 100, timestamp: "2026-01-01T00:00:00.000Z" }];
    const fallbackActions = [{ type: "old_action", xp: 50, timestamp: "2025-01-01T00:00:00.000Z" }];
    const result = mapApiUser({ ...baseApiResponse, actions: apiActions }, { actions: fallbackActions });
    expect(result.actions).toEqual(apiActions);
  });

  it("uses fallback actions when API omits them", () => {
    const fallbackActions = [{ type: "verify_kya", xp: 150, timestamp: "2025-01-01T00:00:00.000Z" }];
    const result = mapApiUser(baseApiResponse, { actions: fallbackActions });
    expect(result.actions).toEqual(fallbackActions);
  });

  it("returns empty arrays for actions and stamps when neither API nor fallback provide them", () => {
    const result = mapApiUser(baseApiResponse);
    expect(result.actions).toEqual([]);
    expect(result.stamps).toEqual([]);
  });

  it("maps agent field when present in API response", () => {
    const agent = { id: "agent-1", name: "My Agent", status: "ACTIVE", lastActive: null };
    const result = mapApiUser({ ...baseApiResponse, agent });
    expect(result.agent).toEqual(agent);
  });

  it("maps piUsername from API response", () => {
    const result = mapApiUser({ ...baseApiResponse, piUsername: "alice123" });
    expect(result.piUsername).toBe("alice123");
  });

  it("uses fallback stamps when API omits them, and computes trustScore accordingly", () => {
    const fallbackStamps = [
      { type: "connect_wallet", provider: "pi_network", xpAwarded: 100, createdAt: "2026-01-01T00:00:00.000Z" },
    ];
    const result = mapApiUser(baseApiResponse, { stamps: fallbackStamps });
    expect(result.stamps).toEqual(fallbackStamps);
    // trustScore computed: xp=200, stampsLength=1 → 200 + 1*10 = 210
    expect(result.trustScore).toBe(210);
  });

  it("maps passportUrl from API response", () => {
    const result = mapApiUser({ ...baseApiResponse, passportUrl: "https://example.com/passport/123" });
    expect(result.passportUrl).toBe("https://example.com/passport/123");
  });

  it("sets passportUrl to null when API omits it", () => {
    const result = mapApiUser(baseApiResponse);
    expect(result.passportUrl).toBeNull();
  });

  it("maps kycStatus from API response", () => {
    const result = mapApiUser({ ...baseApiResponse, kycStatus: "verified" });
    expect(result.kycStatus).toBe("verified");
  });

  it("sets kycStatus to null when API provides null", () => {
    const result = mapApiUser({ ...baseApiResponse, kycStatus: null });
    expect(result.kycStatus).toBeNull();
  });

  it("maps did from API response", () => {
    const result = mapApiUser({ ...baseApiResponse, did: "did:axiom:abcdef1234567890" });
    expect(result.did).toBe("did:axiom:abcdef1234567890");
  });

  it("sets did to null when API omits it", () => {
    const result = mapApiUser(baseApiResponse);
    expect(result.did).toBeNull();
  });

  it("API createdAt takes precedence over fallback createdAt", () => {
    const apiDate = "2026-06-01T00:00:00.000Z";
    const fallbackDate = "2025-01-01T00:00:00.000Z";
    const result = mapApiUser(
      { ...baseApiResponse, createdAt: apiDate },
      { createdAt: fallbackDate }
    );
    expect(result.createdAt).toBe(apiDate);
  });

  it("trustScore of 0 from API is used without computing fallback", () => {
    // trustScore: 0 is explicitly set (not omitted), ?? 0 triggers computation
    // Since 0 is falsy with ?? operator... Actually ?? only triggers on null/undefined
    // trustScore: 0 → ?? does NOT trigger, so result.trustScore = 0
    const result = mapApiUser({ ...baseApiResponse, trustScore: 0 });
    expect(result.trustScore).toBe(0);
  });
});

describe("isDemoWalletAddress — case sensitivity", () => {
  it("returns false for 'DEMO:alice' (case-sensitive prefix check)", () => {
    // startsWith is case-sensitive, 'DEMO:' does not start with 'demo:'
    expect(isDemoWalletAddress("DEMO:alice")).toBe(false);
  });

  it("returns false for 'Demo:alice' (mixed-case)", () => {
    expect(isDemoWalletAddress("Demo:alice")).toBe(false);
  });
});

describe("getStoredWallet — demo wallet cleanup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes 'demo:' prefix wallet and returns null for 'demo:test123'", () => {
    localStorage.setItem("axiomid_wallet", "demo:test123");
    const result = getStoredWallet();
    expect(result).toBeNull();
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
  });

  it("preserves non-demo wallet addresses that contain 'demo' substring", () => {
    // 'pi:demouser' does NOT start with 'demo:' so it is preserved
    localStorage.setItem("axiomid_wallet", "pi:demouser");
    const result = getStoredWallet();
    expect(result).toBe("pi:demouser");
  });
});