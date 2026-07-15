import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PassportIdentity } from "@/components/passport/sections/PassportIdentity";

// Relies on the global useLanguage mock registered in jest.setup.js, which
// returns the translation key itself for keys not present in its mock
// dictionary (label_wallet, label_agent, status_none, etc. are not defined
// there, so t(key) === key).

const defaultProps = {
  username: "testuser",
  did: "did:axiom:pi:testuid123",
  displayAddress: "pi:testuid123",
  shortAddress: "pi:t...123",
  copyToClipboard: jest.fn(),
};

describe("PassportIdentity — name and DID", () => {
  it("renders the username", () => {
    render(<PassportIdentity {...defaultProps} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("renders the full DID", () => {
    render(<PassportIdentity {...defaultProps} />);
    expect(screen.getByText("did:axiom:pi:testuid123")).toBeInTheDocument();
  });

  it("copies the DID (not the wallet address) when the Copy DID button is clicked", () => {
    const copyToClipboard = jest.fn();
    render(<PassportIdentity {...defaultProps} copyToClipboard={copyToClipboard} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy DID" }));

    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    expect(copyToClipboard).toHaveBeenCalledWith("did:axiom:pi:testuid123");
  });
});

describe("PassportIdentity — wallet section", () => {
  it("renders the short wallet address", () => {
    render(<PassportIdentity {...defaultProps} />);
    expect(screen.getByText("pi:t...123")).toBeInTheDocument();
  });

  it("renders a Copy Wallet Address button when displayAddress is provided", () => {
    render(<PassportIdentity {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Copy Wallet Address" })).toBeInTheDocument();
  });

  it("does not render a Copy Wallet Address button when displayAddress is null", () => {
    render(<PassportIdentity {...defaultProps} displayAddress={null} />);
    expect(screen.queryByRole("button", { name: "Copy Wallet Address" })).not.toBeInTheDocument();
  });

  it("copies the wallet address (not the DID) when its copy button is clicked", () => {
    const copyToClipboard = jest.fn();
    render(<PassportIdentity {...defaultProps} copyToClipboard={copyToClipboard} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy Wallet Address" }));

    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    expect(copyToClipboard).toHaveBeenCalledWith("pi:testuid123");
  });

  it("applies the glassmorphism bento-card-2026/glass-card classes to the wallet card", () => {
    render(<PassportIdentity {...defaultProps} />);
    const walletLabel = screen.getByText("label_wallet");
    const walletCard = walletLabel.closest("div");
    expect(walletCard).toHaveClass("bento-card-2026");
    expect(walletCard).toHaveClass("glass-card");
  });
});

describe("PassportIdentity — agent info section", () => {
  it("does not render the agent section when agentName is not provided", () => {
    render(<PassportIdentity {...defaultProps} />);
    expect(screen.queryByText("label_agent")).not.toBeInTheDocument();
  });

  it("renders the agent name when agentName is provided", () => {
    render(<PassportIdentity {...defaultProps} agentName="MyAgent" agentStatus="ACTIVE" />);
    expect(screen.getByText("MyAgent")).toBeInTheDocument();
  });

  it("renders an ACTIVE badge (uppercased) with the active styling when agentStatus is 'active' (case-insensitive)", () => {
    render(<PassportIdentity {...defaultProps} agentName="MyAgent" agentStatus="active" />);
    const badge = screen.getByText("ACTIVE");
    expect(badge).toHaveClass("bg-neon-green/10");
    expect(badge).toHaveClass("text-neon-green");
  });

  it("renders the inactive status text without the active badge styling when agentStatus is not ACTIVE", () => {
    render(<PassportIdentity {...defaultProps} agentName="MyAgent" agentStatus="PAUSED" />);
    const badge = screen.getByText("PAUSED");
    expect(badge).not.toHaveClass("bg-neon-green/10");
    expect(badge).toHaveClass("border");
  });

  it("falls back to the 'status_none' translation key when agentName is provided but agentStatus is undefined", () => {
    render(<PassportIdentity {...defaultProps} agentName="MyAgent" agentStatus={undefined} />);
    expect(screen.getByText("status_none")).toBeInTheDocument();
  });

  it("applies the glassmorphism bento-card-2026/glass-card classes to the agent card", () => {
    render(<PassportIdentity {...defaultProps} agentName="MyAgent" agentStatus="ACTIVE" />);
    const agentLabel = screen.getByText("label_agent");
    const agentCard = agentLabel.closest("div");
    expect(agentCard).toHaveClass("bento-card-2026");
    expect(agentCard).toHaveClass("glass-card");
  });
});