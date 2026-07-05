/**
 * Tests for src/app/layout.tsx metadata (PR change: OpenGraph image dimensions).
 *
 * The root layout renders <html>/<body> tags directly, so it is not suitable
 * for React Testing Library rendering. Instead, we verify the statically
 * exported `metadata` object, which is what Next.js reads to build <head> tags.
 *
 * Heavy third-party modules that are not installed in this environment
 * (@vercel/analytics, @vercel/speed-insights) are mocked so the module can be
 * imported without executing the component body.
 */

jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

import { metadata } from "@/app/layout";

describe("layout metadata — OpenGraph image dimensions (PR change)", () => {
  it("sets the OpenGraph image width to 1200 (was 640)", () => {
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 1200 }),
      ])
    );
  });

  it("sets the OpenGraph image height to 630 (was 640)", () => {
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ height: 630 }),
      ])
    );
  });

  it("uses a standard 1200x630 social-share aspect ratio", () => {
    const images = metadata.openGraph?.images as Array<{ width?: number; height?: number }>;
    const image = images[0];
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
  });

  it("preserves the correct image url and alt text", () => {
    const images = metadata.openGraph?.images as Array<{ url?: string; alt?: string }>;
    const image = images[0];
    expect(image.url).toBe("/axiomid-banner.jpg");
    expect(image.alt).toBe("AxiomID - Human Authorization Protocol");
  });
});