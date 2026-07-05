/**
 * Tests for src/app/build/page.tsx (new in this PR)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import BuildPage from "@/app/build/page";

// Mock Header and Footer to isolate page content tests
jest.mock("@/components/Header", () => {
  const Header = () => <header>Header</header>;
  Header.displayName = "Header";
  return Header;
});
jest.mock("@/components/Footer", () => {
  const Footer = () => <footer>Footer</footer>;
  Footer.displayName = "Footer";
  return Footer;
});

describe("BuildPage", () => {
  it("renders without crashing", () => {
    expect(() => render(<BuildPage />)).not.toThrow();
  });

  it("renders the Header component", () => {
    render(<BuildPage />);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders the Footer component", () => {
    render(<BuildPage />);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the main heading 'Skill Builder'", () => {
    render(<BuildPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Skill Builder" })).toBeInTheDocument();
  });

  it("renders the descriptive tagline about the visual builder", () => {
    render(<BuildPage />);
    expect(
      screen.getByText(/Design, deploy, and monetize custom AI skills\./)
    ).toBeInTheDocument();
  });

  it("renders the 'Coming Soon' section heading", () => {
    render(<BuildPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Coming Soon" })).toBeInTheDocument();
  });

  it("renders the coming soon supporting text", () => {
    render(<BuildPage />);
    expect(
      screen.getByText(/actively working on the visual editor and testing tools/i)
    ).toBeInTheDocument();
  });

  it("renders exactly one h1 and one h2 heading", () => {
    render(<BuildPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });
});