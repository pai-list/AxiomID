/**
 * @jest-environment node
 */

// `server-only` throws when imported outside a server context. Jest's node
// environment is a server context, but we still stub the module defensively
// so the test never depends on Next.js internals.
jest.mock("server-only", () => ({}));

import { getPiEnv, __resetPiEnvCache } from "../env";

const ORIGINAL_ENV = process.env;

describe("getPiEnv", () => {
  beforeEach(() => {
    jest.resetModules();
    __resetPiEnvCache();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PI_API_KEY;
    delete process.env.PI_WALLET_PRIVATE_SEED;
    delete process.env.NEXT_PUBLIC_PI_SANDBOX;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws a descriptive error when PI_API_KEY is missing", () => {
    expect(() => getPiEnv()).toThrow(/PI_API_KEY/);
  });

  it("returns the parsed env when all required values are present", () => {
    process.env.PI_API_KEY = "test-api-key";
    process.env.PI_WALLET_PRIVATE_SEED = "SABCDEF";
    process.env.NEXT_PUBLIC_PI_SANDBOX = "true";
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.axiomid.app";

    const env = getPiEnv();

    expect(env).toEqual({
      apiKey: "test-api-key",
      walletPrivateSeed: "SABCDEF",
      sandbox: true,
      siteUrl: "https://staging.axiomid.app",
    });
  });

  it("defaults sandbox to false and siteUrl to https://axiomid.app", () => {
    process.env.PI_API_KEY = "test-api-key";

    const env = getPiEnv();

    expect(env.sandbox).toBe(false);
    expect(env.siteUrl).toBe("https://axiomid.app");
    expect(env.walletPrivateSeed).toBe("");
  });

  it("caches the resolved env across calls", () => {
    process.env.PI_API_KEY = "first";
    const first = getPiEnv();
    process.env.PI_API_KEY = "second";
    const second = getPiEnv();
    expect(first).toBe(second);
    expect(second.apiKey).toBe("first");
  });

  it("throws when PI_API_KEY is an empty string", () => {
    process.env.PI_API_KEY = "";
    expect(() => getPiEnv()).toThrow(/PI_API_KEY/);
  });

  it("error message includes the [axiomid:pi] namespace prefix", () => {
    expect(() => getPiEnv()).toThrow(/\[axiomid:pi\]/);
  });

  it("error message includes the env var name and namespace", () => {
    expect(() => getPiEnv()).toThrow(/PI_API_KEY/);
    expect(() => getPiEnv()).toThrow(/\[axiomid:pi\]/);
  });

  it("treats NEXT_PUBLIC_PI_SANDBOX='false' as false (not just absence)", () => {
    process.env.PI_API_KEY = "key";
    process.env.NEXT_PUBLIC_PI_SANDBOX = "false";
    expect(getPiEnv().sandbox).toBe(false);
  });

  it("treats NEXT_PUBLIC_PI_SANDBOX='1' as false (only 'true' is truthy)", () => {
    process.env.PI_API_KEY = "key";
    process.env.NEXT_PUBLIC_PI_SANDBOX = "1";
    expect(getPiEnv().sandbox).toBe(false);
  });

  it("treats NEXT_PUBLIC_PI_SANDBOX='TRUE' as false (case-sensitive match)", () => {
    process.env.PI_API_KEY = "key";
    process.env.NEXT_PUBLIC_PI_SANDBOX = "TRUE";
    expect(getPiEnv().sandbox).toBe(false);
  });

  it("__resetPiEnvCache allows a second call to pick up updated env vars", () => {
    process.env.PI_API_KEY = "first-key";
    const first = getPiEnv();
    expect(first.apiKey).toBe("first-key");

    __resetPiEnvCache();

    process.env.PI_API_KEY = "second-key";
    const second = getPiEnv();
    expect(second.apiKey).toBe("second-key");
    expect(first).not.toBe(second);
  });

  it("returned object has exactly the four PiEnv fields", () => {
    process.env.PI_API_KEY = "key";
    const env = getPiEnv();
    expect(Object.keys(env).sort()).toEqual(
      ["apiKey", "sandbox", "siteUrl", "walletPrivateSeed"].sort(),
    );
  });

  it("walletPrivateSeed is empty string when PI_WALLET_PRIVATE_SEED is not set", () => {
    process.env.PI_API_KEY = "key";
    const env = getPiEnv();
    expect(env.walletPrivateSeed).toBe("");
  });

  it("sandbox is a boolean, not a string", () => {
    process.env.PI_API_KEY = "key";
    process.env.NEXT_PUBLIC_PI_SANDBOX = "true";
    const env = getPiEnv();
    expect(typeof env.sandbox).toBe("boolean");
    expect(env.sandbox).toBe(true);
  });

  it("trims surrounding whitespace from env values", () => {
    process.env.PI_API_KEY = "  trimmed-key  \n";
    process.env.PI_WALLET_PRIVATE_SEED = "  SEED  ";
    process.env.NEXT_PUBLIC_SITE_URL = "  https://axiomid.app  ";

    const env = getPiEnv();

    expect(env.apiKey).toBe("trimmed-key");
    expect(env.walletPrivateSeed).toBe("SEED");
    expect(env.siteUrl).toBe("https://axiomid.app");
  });

  it("treats whitespace-only PI_API_KEY as missing", () => {
    process.env.PI_API_KEY = "   ";
    expect(() => getPiEnv()).toThrow(/PI_API_KEY/);
  });
});
