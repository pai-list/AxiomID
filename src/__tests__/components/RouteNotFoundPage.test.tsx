/**
 * Tests for src/components/RouteNotFoundPage.tsx
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { RouteNotFoundPage } from "@/components/RouteNotFoundPage";
import { useLanguage } from "@/app/context/language-context";

// Mock the language context
jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

describe("RouteNotFoundPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render English content when language is en", () => {
    (useLanguage as jest.Mock).mockReturnValue({ language: "en" });

    render(<RouteNotFoundPage />);

    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(screen.getByText("The page you are looking for does not exist or has been moved.")).toBeInTheDocument();
    expect(screen.getByText("GO HOME")).toBeInTheDocument();
  });

  it("should render Arabic content when language is ar", () => {
    (useLanguage as jest.Mock).mockReturnValue({ language: "ar" });

    render(<RouteNotFoundPage />);

    expect(screen.getByText("الصفحة غير موجودة")).toBeInTheDocument();
    expect(screen.getByText("الصفحة التي تبحث عنها غير موجودة أو تم نقلها.")).toBeInTheDocument();
    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
  });

  it("should have a link to the homepage", () => {
    (useLanguage as jest.Mock).mockReturnValue({ language: "en" });

    render(<RouteNotFoundPage />);

    const link = screen.getByRole("link", { name: "GO HOME" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("should render a search icon", () => {
    (useLanguage as jest.Mock).mockReturnValue({ language: "en" });

    render(<RouteNotFoundPage />);

    expect(screen.getByText("🔍")).toBeInTheDocument();
  });
});
