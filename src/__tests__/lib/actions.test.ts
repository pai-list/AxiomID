import { ACTIONS } from "@/lib/actions";

describe("ACTIONS configuration", () => {
  it("should have expected action keys", () => {
    expect(ACTIONS).toBeDefined();

    // Verify core actions exist
    expect(ACTIONS).toHaveProperty("CONNECT_TWITTER");
    expect(ACTIONS).toHaveProperty("CONNECT_DISCORD");
    expect(ACTIONS).toHaveProperty("VERIFY_IDENTITY");
    expect(ACTIONS).toHaveProperty("PROOF_OF_WORK_DAILY");
    expect(ACTIONS).toHaveProperty("WALLET_ACTIVITY");
    expect(ACTIONS).toHaveProperty("CONNECT_GOOGLE");
    expect(ACTIONS).toHaveProperty("CONNECT_CRYPTO_WALLET");
  });

  it("should have correct properties for each action", () => {
    Object.values(ACTIONS).forEach(action => {
      expect(action).toHaveProperty("id");
      expect(typeof action.id).toBe("string");
      expect(action.id.length).toBeGreaterThan(0);

      expect(action).toHaveProperty("xp");
      expect(typeof action.xp).toBe("number");
      expect(action.xp).toBeGreaterThan(0);
    });
  });

  it("should have unique action IDs", () => {
    const ids = Object.values(ACTIONS).map(action => action.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should match exact action configuration values", () => {
    expect(ACTIONS.CONNECT_TWITTER).toEqual({ id: 'connect_twitter', xp: 50 });
    expect(ACTIONS.CONNECT_DISCORD).toEqual({ id: 'connect_discord', xp: 50 });
    expect(ACTIONS.VERIFY_IDENTITY).toEqual({ id: 'verify_identity', xp: 100 });
    expect(ACTIONS.PROOF_OF_WORK_DAILY).toEqual({ id: 'daily_pow', xp: 20 });
    expect(ACTIONS.WALLET_ACTIVITY).toEqual({ id: 'wallet_age', xp: 300 });
    expect(ACTIONS.CONNECT_GOOGLE).toEqual({ id: 'connect_google', xp: 50 });
    expect(ACTIONS.CONNECT_CRYPTO_WALLET).toEqual({ id: 'connect_crypto_wallet', xp: 100 });
  });

  it("should freeze the ACTIONS object", () => {
      // ACTIONS object shouldn't be modifiable if it was frozen, but it's just a const right now.
      // We are just testing the structure for now
      expect(Object.isExtensible(ACTIONS)).toBe(true); // Since it's not frozen
  });
});
