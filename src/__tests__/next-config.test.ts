/**
 * Structural tests for next.config.ts.
 *
 * next.config.ts was rewritten in this PR from an empty config to one with
 * specific build-time toggles. These tests lock in those intentional settings
 * so they cannot be silently reverted.
 *
 * @jest-environment node
 */

import nextConfig from "../../next.config";

describe("next.config — build-time settings", () => {
  it("enables React strict mode", () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it("removes the X-Powered-By header", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("disables production browser source maps", () => {
    expect(nextConfig.productionBrowserSourceMaps).toBe(false);
  });
});

describe("next.config — image optimisation", () => {
  it("lists avif as the first preferred image format", () => {
    expect(nextConfig.images?.formats?.[0]).toBe("image/avif");
  });

  it("lists webp as the second preferred image format", () => {
    expect(nextConfig.images?.formats?.[1]).toBe("image/webp");
  });

  it("specifies exactly two image formats", () => {
    expect(nextConfig.images?.formats).toHaveLength(2);
  });
});

describe("next.config — experimental features", () => {
  it("enables typedRoutes", () => {
    expect(nextConfig.typedRoutes).toBe(true);
  });
});