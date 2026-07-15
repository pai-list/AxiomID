import React from "react";
import { render, screen } from "@testing-library/react";
import { PassportStats } from "@/components/passport/sections/PassportStats";

// TrustScoreGauge is pre-existing, unchanged code — mock it so this test
// suite only exercises PassportStats' own logic (score pass-through,
// XP formatting, date formatting, and the new glassmorphism classes).
jest.mock("@/components/TrustScoreGauge", () => ({
  TrustScoreGauge: ({ score, size }: { score: number; size: number }) => (
    <div data-testid="trust-score-gauge" data-score={score} data-size={size} />
  ),
}));

describe("PassportStats — trust score card", () => {
  it("passes the trustScore prop through to TrustScoreGauge", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    const gauge = screen.getByTestId("trust-score-gauge");
    expect(gauge).toHaveAttribute("data-score", "72");
  });

  it("renders the trust label", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    expect(screen.getByText("label_trust")).toBeInTheDocument();
  });

  it("applies the blue stat-card-glow variant to the trust score card", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    const trustLabel = screen.getByText("label_trust");
    const card = trustLabel.closest("div");
    expect(card).toHaveClass("stat-card-glow");
    expect(card).toHaveClass("blue");
  });
});

describe("PassportStats — XP card", () => {
  it("renders the XP label", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    expect(screen.getByText("label_xp")).toBeInTheDocument();
  });

  it("formats XP with locale thousands separators", () => {
    render(<PassportStats trustScore={72} xp={12345} issuedDate="2023-06-15" />);
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("renders zero XP correctly", () => {
    render(<PassportStats trustScore={0} xp={0} issuedDate="2023-06-15" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("applies the purple stat-card-glow variant and the holographic animation to the XP card", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    const xpLabel = screen.getByText("label_xp");
    const card = xpLabel.closest("div");
    expect(card).toHaveClass("stat-card-glow");
    expect(card).toHaveClass("purple");
    expect(card).toHaveClass("animate-holographic");
  });
});

describe("PassportStats — issued date card", () => {
  it("renders the issued label", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    expect(screen.getByText("label_issued")).toBeInTheDocument();
  });

  it("formats a valid ISO date as 'Mon YYYY'", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15T00:00:00.000Z" />);
    expect(screen.getByText("Jun 2023")).toBeInTheDocument();
  });

  it("renders 'N/A' when issuedDate is not a parseable date", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="not-a-date" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders 'N/A' when issuedDate is an empty string", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("does not apply the stat-card-glow effect to the issued date card", () => {
    render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    const issuedLabel = screen.getByText("label_issued");
    const card = issuedLabel.closest("div");
    expect(card).not.toHaveClass("stat-card-glow");
    expect(card).toHaveClass("bento-card-2026");
    expect(card).toHaveClass("glass-card");
  });
});

describe("PassportStats — layout", () => {
  it("renders exactly 3 stat cards in a 3-column grid", () => {
    const { container } = render(<PassportStats trustScore={72} xp={100} issuedDate="2023-06-15" />);
    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass("grid-cols-3");
    expect(grid.children).toHaveLength(3);
  });
});