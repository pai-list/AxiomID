/**
 * Tests for src/components/OptimizedImage.tsx
 *
 * PR changes:
 * - Banner component and BannerProps interface were removed.
 * - OptimizedImage and Avatar remain unchanged.
 *
 * These tests verify:
 * 1. Banner is no longer exported (regression guard).
 * 2. The still-present exports (OptimizedImage, Avatar) are functional.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/image to render a plain <img> to avoid Next.js image internals in jsdom
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { blurDataURL?: string; placeholder?: string }) => {
    const { blurDataURL: _blur, placeholder: _placeholder, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

// Mock the image URL helper — just return the src unchanged
jest.mock("@/lib/images", () => ({
  getOptimizedImageUrl: jest.fn((src: string) => src),
}));

import * as OptimizedImageModule from "@/components/OptimizedImage";

// ─── Banner removal (PR change) ──────────────────────────────────────────────

describe("OptimizedImage.tsx — Banner removal (PR change)", () => {
  it("does NOT export a Banner named export", () => {
    expect((OptimizedImageModule as Record<string, unknown>)["Banner"]).toBeUndefined();
  });

  it("still exports OptimizedImage", () => {
    expect(OptimizedImageModule.OptimizedImage).toBeDefined();
    expect(typeof OptimizedImageModule.OptimizedImage).toBe("function");
  });

  it("still exports Avatar", () => {
    expect(OptimizedImageModule.Avatar).toBeDefined();
    expect(typeof OptimizedImageModule.Avatar).toBe("function");
  });
});

// ─── OptimizedImage smoke tests ───────────────────────────────────────────────

describe("OptimizedImage — rendering", () => {
  const { OptimizedImage } = OptimizedImageModule;

  it("renders an img element with the provided alt text", () => {
    render(<OptimizedImage src="/test.png" alt="Test image" />);
    expect(screen.getByAltText("Test image")).toBeInTheDocument();
  });

  it("renders a loading spinner by default (showLoading=true initially)", () => {
    render(<OptimizedImage src="/test.png" alt="Loading test" showLoading={true} />);
    // The spinner is rendered as a div with animate-spin while isLoading is true
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("does not render loading spinner when showLoading=false", () => {
    render(<OptimizedImage src="/test.png" alt="No loading" showLoading={false} />);
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });

  it("applies className to the wrapper div", () => {
    const { container } = render(
      <OptimizedImage src="/test.png" alt="Styled image" className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});

// ─── Avatar smoke tests ───────────────────────────────────────────────────────

describe("Avatar — rendering", () => {
  const { Avatar } = OptimizedImageModule;

  it("renders initials fallback when src is null", () => {
    render(<Avatar src={null} alt="John Doe" />);
    // First letter of alt text as uppercase initial
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders initials fallback when src is undefined", () => {
    render(<Avatar alt="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders provided fallback text instead of alt initial when given", () => {
    render(<Avatar src={null} alt="John Doe" fallback="JD" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders an img element when src is provided", () => {
    render(<Avatar src="/avatar.png" alt="User Avatar" />);
    expect(screen.getByAltText("User Avatar")).toBeInTheDocument();
  });
});