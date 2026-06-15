/**
 * Tests for src/components/LanguageToggle.tsx
 *
 * PR change: Updated className to add min-h-[44px] min-w-[44px] justify-center
 * for improved mobile touch target compliance (WCAG 2.5.5 / iOS HIG).
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LanguageToggle from "@/components/LanguageToggle";

// useLanguage is globally mocked in jest.setup.js, but we need to control it per-test
jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

import { useLanguage } from "@/app/context/language-context";
const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

function makeLanguageCtx(overrides: { language?: "en" | "ar"; setLanguage?: jest.Mock; t?: (key: string) => string } = {}) {
  return {
    language: "en" as "en" | "ar",
    setLanguage: jest.fn(),
    t: (key: string) => key,
    ...overrides,
  };
}

describe("LanguageToggle — rendering", () => {
  it("renders a button with aria-label 'Toggle language'", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    expect(screen.getByRole("button", { name: /toggle language/i })).toBeInTheDocument();
  });

  it("shows 'العربية' label when current language is 'en'", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx({ language: "en" }));
    render(<LanguageToggle />);
    expect(screen.getByText("العربية")).toBeInTheDocument();
  });

  it("shows 'English' label when current language is 'ar'", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx({ language: "ar" }));
    render(<LanguageToggle />);
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("renders the globe emoji '🌐' icon", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    expect(screen.getByText("🌐")).toBeInTheDocument();
  });
});

describe("LanguageToggle — interaction", () => {
  it("calls setLanguage with 'ar' when current language is 'en' and button is clicked", () => {
    const setLanguage = jest.fn();
    mockUseLanguage.mockReturnValue(makeLanguageCtx({ language: "en", setLanguage }));
    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle language/i }));
    expect(setLanguage).toHaveBeenCalledWith("ar");
    expect(setLanguage).toHaveBeenCalledTimes(1);
  });

  it("calls setLanguage with 'en' when current language is 'ar' and button is clicked", () => {
    const setLanguage = jest.fn();
    mockUseLanguage.mockReturnValue(makeLanguageCtx({ language: "ar", setLanguage }));
    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle language/i }));
    expect(setLanguage).toHaveBeenCalledWith("en");
    expect(setLanguage).toHaveBeenCalledTimes(1);
  });

  it("calls setLanguage exactly once per click", () => {
    const setLanguage = jest.fn();
    mockUseLanguage.mockReturnValue(makeLanguageCtx({ language: "en", setLanguage }));
    render(<LanguageToggle />);
    const btn = screen.getByRole("button", { name: /toggle language/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(setLanguage).toHaveBeenCalledTimes(3);
  });
});

describe("LanguageToggle — touch target (PR change: min-h-[44px] min-w-[44px])", () => {
  it("button has min-h-[44px] class for touch target compliance", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    const btn = screen.getByRole("button", { name: /toggle language/i });
    expect(btn.className).toContain("min-h-[44px]");
  });

  it("button has min-w-[44px] class for touch target compliance", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    const btn = screen.getByRole("button", { name: /toggle language/i });
    expect(btn.className).toContain("min-w-[44px]");
  });

  it("button has justify-center class (PR change: centering with explicit sizing)", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    const btn = screen.getByRole("button", { name: /toggle language/i });
    expect(btn.className).toContain("justify-center");
  });

  it("button has py-2 padding (PR change from py-1.5)", () => {
    mockUseLanguage.mockReturnValue(makeLanguageCtx());
    render(<LanguageToggle />);
    const btn = screen.getByRole("button", { name: /toggle language/i });
    expect(btn.className).toContain("py-2");
  });
});