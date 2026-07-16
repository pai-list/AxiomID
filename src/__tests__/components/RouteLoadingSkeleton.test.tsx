/**
 * Tests for src/components/RouteLoadingSkeleton.tsx
 *
 * PR changes:
 * - Root container gains an `animate-fadeIn` class so the skeleton fades in.
 * - The individual skeleton bars switch from the hardcoded `bg-white/5` to
 *   the theme-aware `bg-glass` utility class.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import RouteLoadingSkeleton from "@/components/RouteLoadingSkeleton";

describe("RouteLoadingSkeleton — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<RouteLoadingSkeleton />)).not.toThrow();
  });

  it("renders a status region with aria-busy=true", () => {
    render(<RouteLoadingSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("renders a status region with an accessible name for page loading", () => {
    render(<RouteLoadingSkeleton />);
    expect(screen.getByRole("status", { name: /page loading/i })).toBeInTheDocument();
  });

  it("applies the animate-fadeIn class to the root container (PR change)", () => {
    render(<RouteLoadingSkeleton />);
    expect(screen.getByRole("status")).toHaveClass("animate-fadeIn");
  });

  it("retains the existing layout classes on the root container", () => {
    render(<RouteLoadingSkeleton />);
    expect(screen.getByRole("status")).toHaveClass(
      "min-h-screen",
      "bg-grid",
      "flex",
      "items-center",
      "justify-center",
      "p-4"
    );
  });
});

describe("RouteLoadingSkeleton — skeleton bars (PR change: bg-glass instead of bg-white/5)", () => {
  it("renders four skeleton bars using the bg-glass utility class", () => {
    const { container } = render(<RouteLoadingSkeleton />);
    const bars = container.querySelectorAll(".bg-glass");
    expect(bars.length).toBe(4);
  });

  it("does not render any bar using the old hardcoded bg-white/5 class", () => {
    const { container } = render(<RouteLoadingSkeleton />);
    expect(container.querySelectorAll(".bg-white\\/5").length).toBe(0);
  });

  it("renders bars with the expected width classes", () => {
    const { container } = render(<RouteLoadingSkeleton />);
    const bars = Array.from(container.querySelectorAll(".bg-glass"));
    const widthClasses = bars.map((bar) =>
      Array.from(bar.classList).find((cls) => cls.startsWith("w-"))
    );
    expect(widthClasses).toEqual(["w-1/3", "w-2/3", "w-1/2", "w-full"]);
  });

  it("wraps the skeleton bars in a pulsing container", () => {
    const { container } = render(<RouteLoadingSkeleton />);
    const pulseContainer = container.querySelector(".animate-pulse");
    expect(pulseContainer).not.toBeNull();
    expect(pulseContainer?.querySelectorAll(".bg-glass").length).toBe(4);
  });
});