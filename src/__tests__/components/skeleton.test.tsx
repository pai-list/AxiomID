import React from "react";
import { render } from "@testing-library/react";
import { SkeletonLine, SkeletonCard, SkeletonCircle, SkeletonImage } from "@/components/ui/skeleton";

describe("SkeletonLine", () => {
  it("renders with default width", () => {
    const { container } = render(<SkeletonLine />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom width and height", () => {
    const { container } = render(<SkeletonLine width="50%" height="2rem" />);
    expect(container.firstChild).toHaveStyle({ width: "50%", height: "2rem" });
  });

  it("merges className", () => {
    const { container } = render(<SkeletonLine className="rounded-lg" />);
    expect(container.firstChild).toHaveClass("rounded-lg");
  });

  it("prevents caller from overriding contract props", () => {
    const { container } = render(<SkeletonLine data-testid="override" aria-hidden={false} />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkeletonCard", () => {
  it("renders card skeleton", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("prevents caller from overriding contract props", () => {
    const { container } = render(<SkeletonCard data-testid="override" aria-hidden={false} />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkeletonCircle", () => {
  it("renders with default size", () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("rounded-full");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom size", () => {
    const { container } = render(<SkeletonCircle size="4rem" />);
    expect(container.firstChild).toHaveStyle({ width: "4rem", height: "4rem" });
  });

  it("prevents caller from overriding contract props", () => {
    const { container } = render(<SkeletonCircle data-testid="override" aria-hidden={false} />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkeletonImage", () => {
  it("renders with aspect ratio", () => {
    const { container } = render(<SkeletonImage />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
    expect(container.firstChild).toHaveClass("rounded-lg");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom aspect ratio", () => {
    const { container } = render(<SkeletonImage aspectRatio="16/9" />);
    expect(container.firstChild).toHaveStyle({ aspectRatio: "16/9" });
  });

  it("prevents caller from overriding contract props", () => {
    const { container } = render(<SkeletonImage data-testid="override" aria-hidden={false} />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
