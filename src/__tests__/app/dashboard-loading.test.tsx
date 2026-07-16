/**
 * Tests for src/app/dashboard/loading.tsx
 *
 * PR change: the route-level loading skeleton for /dashboard now includes
 * an `animate-fadeIn` class on its root element so the skeleton fades in
 * instead of appearing abruptly.
 */

import React from "react";
import { render } from "@testing-library/react";
import DashboardLoading from "@/app/dashboard/loading";

describe("dashboard/loading.tsx — DashboardLoading page", () => {
  it("renders without crashing", () => {
    expect(() => render(<DashboardLoading />)).not.toThrow();
  });

  it("applies the animate-fadeIn class to the root container (PR change)", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.firstChild).toHaveClass("animate-fadeIn");
  });

  it("retains the existing spacing classes on the root container", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.firstChild).toHaveClass("space-y-6", "p-8");
  });

  it("renders the header bento-card skeleton block", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.querySelectorAll(".bento-card").length).toBeGreaterThanOrEqual(1);
  });

  it("renders exactly three secondary skeleton cards in the grid", () => {
    const { container } = render(<DashboardLoading />);
    const grid = container.querySelector(".grid.grid-cols-1.md\\:grid-cols-3");
    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBe(3);
  });

  it("renders pulse skeleton bars inside each card", () => {
    const { container } = render(<DashboardLoading />);
    const pulseBars = container.querySelectorAll(".animate-pulse");
    // 2 bars in the header card + 2 bars per each of the 3 grid cards
    expect(pulseBars.length).toBe(2 + 3 * 2);
  });
});