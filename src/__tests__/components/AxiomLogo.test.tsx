import React from "react";
import { render, screen } from "@testing-library/react";
import { AxiomLogo } from "@/components/AxiomLogo";

describe("AxiomLogo — rendering", () => {
  it("renders without crashing", () => {
    render(<AxiomLogo />);
  });

  it("renders the AXIOMID wordmark by default", () => {
    render(<AxiomLogo />);
    expect(screen.getByText(/AXIOM/)).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
  });

  it("hides the wordmark when showWordmark is false", () => {
    render(<AxiomLogo showWordmark={false} />);
    expect(screen.queryByText(/AXIOM/)).not.toBeInTheDocument();
  });

  it("renders the SVG logo icon regardless of wordmark setting", () => {
    const { container } = render(<AxiomLogo showWordmark={false} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the sm size box classes", () => {
    const { container } = render(<AxiomLogo size="sm" showWordmark={false} />);
    const logoBox = container.querySelector(".w-8.h-8.rounded-lg");
    expect(logoBox).toBeInTheDocument();
  });

  it("applies the md size box classes (default)", () => {
    const { container } = render(<AxiomLogo showWordmark={false} />);
    const logoBox = container.querySelector(".w-9.h-9.rounded-xl");
    expect(logoBox).toBeInTheDocument();
  });

  it("applies the lg size box classes", () => {
    const { container } = render(<AxiomLogo size="lg" showWordmark={false} />);
    const logoBox = container.querySelector(".w-12.h-12.rounded-xl");
    expect(logoBox).toBeInTheDocument();
  });

  it("passes through a custom className to the outer wrapper", () => {
    const { container } = render(<AxiomLogo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("renders a linearGradient for the logo SVG circle stroke", () => {
    const { container } = render(<AxiomLogo />);
    const gradient = container.querySelector("defs > linearGradient");
    expect(gradient).toBeInTheDocument();
  });

  it("uses a unique gradient id per instance to avoid collisions", () => {
    const { container } = render(
      <>
        <AxiomLogo />
        <AxiomLogo />
      </>
    );
    const gradients = container.querySelectorAll("defs > linearGradient");
    expect(gradients).toHaveLength(2);
    const ids = Array.from(gradients).map((g) => g.getAttribute("id"));
    expect(ids[0]).not.toEqual(ids[1]);
    // The circle stroke must reference its own gradient id
    const circles = container.querySelectorAll("circle");
    circles.forEach((circle, i) => {
      expect(circle.getAttribute("stroke")).toBe(`url(#${ids[i]})`);
    });
  });

  it("renders the 'A' letter path in the SVG", () => {
    const { container } = render(<AxiomLogo />);
    const paths = container.querySelectorAll("path");
    // The logo has two path elements: the A shape and the accent bar
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });
});

describe("AxiomLogo — size variations", () => {
  it.each([
    ["sm", "w-4", "h-4"],
    ["md", "w-5.5", "h-5.5"],
    ["lg", "w-7", "h-7"],
  ] as const)("size=%s renders SVG with correct CSS classes", (size, w, h) => {
    const { container } = render(<AxiomLogo size={size} showWordmark={false} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass(w);
    expect(svg).toHaveClass(h);
  });
});