/**
 * Tests for src/components/claim/ConnectStep.tsx
 *
 * PR change: ConnectStep now accepts an optional `onDemoConnect` prop. When
 * provided (and the user is not in the Pi Browser, not connected, and has no
 * walletAddress), a "Try Demo Mode" button is rendered that lets users
 * bypass the Pi Browser requirement and explore the app in demo mode.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConnectStep } from "@/components/claim/ConnectStep";
import type { User } from "@/app/context/wallet-context";

const t = (en: string, _ar: string) => en;

const connectedUser: User = {
  id: "user-1",
  walletAddress: "GABC1234567890abcdef",
  piUsername: "testpioneer",
  xp: 100,
  tier: "Citizen",
  trustScore: 80,
  stamps: [],
  actions: [],
  agent: null,
  createdAt: new Date().toISOString(),
};

function defaultProps(overrides: Partial<Parameters<typeof ConnectStep>[0]> = {}) {
  return {
    t,
    walletConnected: false,
    user: null,
    handleConnect: jest.fn(),
    isConnecting: false,
    isPiBrowser: false,
    connectError: null,
    ...overrides,
  };
}

describe("ConnectStep — basic rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<ConnectStep {...defaultProps()} />)).not.toThrow();
  });

  it("renders 'Connect Wallet' heading", () => {
    render(<ConnectStep {...defaultProps()} />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("renders CONNECT PI WALLET button when not connected", () => {
    render(<ConnectStep {...defaultProps()} />);
    expect(screen.getByText("CONNECT PI WALLET")).toBeInTheDocument();
  });

  it("calls handleConnect when CONNECT PI WALLET is clicked", () => {
    const handleConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ handleConnect })} />);
    fireEvent.click(screen.getByText("CONNECT PI WALLET"));
    expect(handleConnect).toHaveBeenCalledTimes(1);
  });

  it("shows CONNECTING... and disables the button while isConnecting is true", () => {
    render(<ConnectStep {...defaultProps({ isConnecting: true })} />);
    expect(screen.getByText("CONNECTING...")).toBeInTheDocument();
    expect(screen.queryByText("CONNECT PI WALLET")).toBeNull();
  });

  it("renders 'Connected' badge when walletConnected is true", () => {
    render(<ConnectStep {...defaultProps({ walletConnected: true })} />);
    // Badge text + fallback paragraph when no walletAddress
    expect(screen.getAllByText("Connected").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'Connected' badge and truncated wallet address when user has a walletAddress", () => {
    render(<ConnectStep {...defaultProps({ user: connectedUser })} />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText(/GABC12345678\.\.\.abcdef/)).toBeInTheDocument();
  });

  it("renders the connectError message when set", () => {
    render(<ConnectStep {...defaultProps({ connectError: "Connection failed" })} />);
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("does not render a connectError message when null", () => {
    render(<ConnectStep {...defaultProps({ connectError: null })} />);
    expect(screen.queryByText("Connection failed")).toBeNull();
  });

  it("renders the Pi Browser Required warning when not in Pi Browser and not connected", () => {
    render(<ConnectStep {...defaultProps({ isPiBrowser: false })} />);
    expect(screen.getByText("Pi Browser Required")).toBeInTheDocument();
  });

  it("does not render the Pi Browser Required warning when isPiBrowser is true", () => {
    render(<ConnectStep {...defaultProps({ isPiBrowser: true })} />);
    expect(screen.queryByText("Pi Browser Required")).toBeNull();
  });
});

// ─── PR change: optional onDemoConnect prop renders a "Try Demo Mode" button ───
describe("ConnectStep — Try Demo Mode button (PR change: onDemoConnect)", () => {
  it("renders 'Try Demo Mode' when onDemoConnect is provided, not in Pi Browser, and not connected", () => {
    const onDemoConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect })} />);
    expect(screen.getByText("Try Demo Mode")).toBeInTheDocument();
  });

  it("does not render 'Try Demo Mode' when onDemoConnect is not provided", () => {
    render(<ConnectStep {...defaultProps({ onDemoConnect: undefined })} />);
    expect(screen.queryByText("Try Demo Mode")).toBeNull();
  });

  it("does not render 'Try Demo Mode' when isPiBrowser is true", () => {
    const onDemoConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect, isPiBrowser: true })} />);
    expect(screen.queryByText("Try Demo Mode")).toBeNull();
  });

  it("does not render 'Try Demo Mode' when walletConnected is true", () => {
    const onDemoConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect, walletConnected: true })} />);
    expect(screen.queryByText("Try Demo Mode")).toBeNull();
  });

  it("does not render 'Try Demo Mode' when user already has a walletAddress", () => {
    const onDemoConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect, user: connectedUser })} />);
    expect(screen.queryByText("Try Demo Mode")).toBeNull();
  });

  it("calls onDemoConnect exactly once when 'Try Demo Mode' is clicked", () => {
    const onDemoConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect })} />);
    fireEvent.click(screen.getByText("Try Demo Mode"));
    expect(onDemoConnect).toHaveBeenCalledTimes(1);
  });

  it("does not call handleConnect when 'Try Demo Mode' is clicked", () => {
    const onDemoConnect = jest.fn();
    const handleConnect = jest.fn();
    render(<ConnectStep {...defaultProps({ onDemoConnect, handleConnect })} />);
    fireEvent.click(screen.getByText("Try Demo Mode"));
    expect(handleConnect).not.toHaveBeenCalled();
  });
});