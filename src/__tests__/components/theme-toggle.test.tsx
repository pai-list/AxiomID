/**
 * Tests for src/components/ThemeToggle.tsx
 *
 * PR change: Updated className to add min-h-[44px] min-w-[44px] justify-center
 * for improved mobile touch target compliance (WCAG 2.5.5 / iOS HIG).
 * Also changed py-1.5 → py-2.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

jest.mock("@/app/context/theme-context", () => ({
  useTheme: jest.fn(),
}));

import { useTheme } from "@/app/context/theme-context";
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

function makeThemeCtx(overrides: { theme?: "dark" | "light"; toggleTheme?: jest.Mock; setTheme?: jest.Mock } = {}) {
  return {
    theme: "dark" as "dark" | "light",
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
    ...overrides,
  };
}

describe("ThemeToggle — rendering", () => {
  it("renders a button element", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders Sun icon when current theme is 'dark'", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx({ theme: "dark" }));
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Moon icon when current theme is 'light'", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx({ theme: "light" }));
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("sets aria-label to 'Switch to light mode' when theme is 'dark'", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx({ theme: "dark" }));
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it("sets aria-label to 'Switch to dark mode' when theme is 'light'", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx({ theme: "light" }));
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it("accepts and applies an additional className prop", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle className="custom-class" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class");
  });

  it("renders without error when no className prop is provided", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });
});

describe("ThemeToggle — interaction", () => {
  it("calls toggleTheme when the button is clicked", () => {
    const toggleTheme = jest.fn();
    mockUseTheme.mockReturnValue(makeThemeCtx({ toggleTheme }));
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("calls toggleTheme on each click (multiple clicks)", () => {
    const toggleTheme = jest.fn();
    mockUseTheme.mockReturnValue(makeThemeCtx({ toggleTheme }));
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(toggleTheme).toHaveBeenCalledTimes(2);
  });
});

describe("ThemeToggle — touch target (PR change: min-h-[44px] min-w-[44px])", () => {
  it("button has min-h-[44px] class for touch target compliance", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("min-h-[44px]");
  });

  it("button has min-w-[44px] class for touch target compliance", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("min-w-[44px]");
  });

  it("button has justify-center class (PR change: centering with explicit sizing)", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("justify-center");
  });

  it("button has py-2 padding (PR change from py-1.5)", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("py-2");
  });

  it("preserves base display classes (flex, items-center, gap-1.5)", () => {
    mockUseTheme.mockReturnValue(makeThemeCtx());
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("flex");
    expect(btn.className).toContain("items-center");
    expect(btn.className).toContain("gap-1.5");
  });
});