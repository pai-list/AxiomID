import "../../../jest.setup.js";
HTMLDialogElement.prototype.showModal = jest.fn();
HTMLDialogElement.prototype.close = jest.fn();
import React from "react";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import SettingsPage from "@/app/dashboard/settings/page";
import { useWallet } from "@/app/context/wallet-context";

// Mock next/link
jest.mock("next/link", () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

// Minimal mocks for Lucide icons to reduce noise
jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"),
  Shield: () => <div data-testid="icon-shield" />,
  User: () => <div data-testid="icon-user" />,
  Zap: () => <div data-testid="icon-zap" />,
  CheckCircle: () => <div data-testid="icon-check" />,
  AtSign: () => <div data-testid="icon-atsign" />,
  MessageCircle: () => <div data-testid="icon-message" />,
  Key: () => <div data-testid="icon-key" />,
  Download: () => <div data-testid="icon-download" />,
  AlertTriangle: () => <div data-testid="icon-alert" />,
  ArrowLeft: () => <div data-testid="icon-arrow" />
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUser = {
  id: "e2e-user-1",
  walletAddress: "GBV...XXXX",
  piUsername: "testuser",
  xp: 1500,
  tier: "Pioneer",
  trustScore: 45,
  kycStatus: "VERIFIED",
  createdAt: "2026-01-01T12:00:00Z",
  did: "did:axiom:test1234",
  stamps: [
    { id: "s1", type: "connect_wallet", metadata: JSON.stringify({ provider: "pi" }) },
    { id: "s2", type: "complete_kyc", metadata: JSON.stringify({ verified: true, level: 2 }) },
  ],
};

const mockStatusDetails = {
  recentLedger: [
    { id: "tx1", amount: 100, reason: "connect_wallet", createdAt: "2026-01-02T12:00:00Z" },
    { id: "tx2", amount: 200, reason: "complete_kyc", createdAt: "2026-01-03T12:00:00Z" }
  ],
  stats: {
    totalActions: 5,
    totalXP: 1500
  }
};

jest.mock("@/app/context/language-context", () => ({ useLanguage: () => ({ t: (k: string) => k, language: "en", setLanguage: jest.fn() }) }));
jest.mock("@/app/context/wallet-context", () => {
  const actual = jest.requireActual("@/app/context/wallet-context");
  return {
    ...actual,
    useWallet: jest.fn()
  };
});

describe("Dashboard Settings Page E2E/Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      user: mockUser,
      connectWallet: jest.fn(),
      claimAction: jest.fn(),
      refreshUser: jest.fn(),
      isLoading: false
    });

    mockFetch.mockImplementation((url) => {
      if (url === "/api/user/status") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatusDetails)
        });
      }
      if (url === "/api/social/disconnect") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    // Mock createObjectURL / revokeObjectURL for file export
    window.URL.createObjectURL = jest.fn();
    window.URL.revokeObjectURL = jest.fn();
  });

  it("loads the page, fetches status details, and allows navigating through tabs", async () => {
    render(<SettingsPage />);

    // Check default tab (Profile)
    await waitFor(() => {
      expect(screen.getAllByText("testuser").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pioneer/i).length).toBeGreaterThan(0);
    });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith("/api/user/status", expect.any(Object));

    // Switch to Accounts tab
    const accountsTab = screen.getByText("settings_sidebar_accounts");
    act(() => { fireEvent.click(accountsTab); });

    // Verify Accounts tab content
    expect(screen.getByText("Wallet Connection")).toBeInTheDocument();
    expect(screen.getByText("KYC Verification")).toBeInTheDocument();

    // Switch to Ledger tab
    const ledgerTab = screen.getByText("settings_sidebar_ledger");
    act(() => { fireEvent.click(ledgerTab); });

    // Verify Ledger tab content (transactions loaded from mockStatusDetails)
    expect(screen.getByText("connect wallet")).toBeInTheDocument(); // replaceAll("_", " ")
    expect(screen.getByText("complete kyc")).toBeInTheDocument();

    // Switch to Settings tab
    const settingsTab = screen.getByText("settings_sidebar_settings");
    act(() => { fireEvent.click(settingsTab); });

    // Verify Settings tab content (Export and Danger Zone)
    expect(screen.getByText("settings_export_data")).toBeInTheDocument();
    expect(screen.getByText("settings_danger_zone")).toBeInTheDocument();
  });

  it("handles the full disconnect flow successfully", async () => {
    render(<SettingsPage />);

    // Navigate to Settings tab where Danger Zone is
    act(() => { fireEvent.click(screen.getByText("settings_sidebar_settings")); });

    // Find disconnect buttons for connected platforms (Wallet Connection & KYC Verification)
    const disconnectBtns = screen.getAllByText("settings_disconnect_btn");
    expect(disconnectBtns.length).toBe(2);

    // Click the first disconnect button (Wallet Connection)
    act(() => { fireEvent.click(disconnectBtns[0]); });

    // Dialog should open
    expect(screen.getByText("settings_confirm_title")).toBeInTheDocument();

    // Click confirm
    const confirmBtn = screen.getByText("settings_confirm_action");
    act(() => { fireEvent.click(confirmBtn); });

    // Verify it called the API correctly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/social/disconnect", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ platform: "connect_wallet" })
      }));
    });

    // Verify data is refreshed
    expect((useWallet as jest.Mock)().refreshUser).toHaveBeenCalled();
  });

  it("handles the export data functionality", async () => {
    render(<SettingsPage />);

    // Navigate to Settings tab
    act(() => { fireEvent.click(screen.getByText("settings_sidebar_settings")); });

    // Click Export Data button
    const exportBtn = screen.getByText("settings_export_btn");
    act(() => { fireEvent.click(exportBtn); });

    // Verify Blob and URL creation
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it("allows inspecting verifiable credentials from the accounts tab", async () => {
    render(<SettingsPage />);

    // Navigate to Accounts tab
    act(() => { fireEvent.click(screen.getByText("settings_sidebar_accounts")); });

    // Find "INSPECT VC" buttons (since we mocked 2 stamps, we should have 2 connected platforms with VC)
    const inspectBtns = screen.getAllByText("inspect_vc");

    // Click the first one (connect_wallet)
    act(() => { fireEvent.click(inspectBtns[0]); });

    // Modal should open and show the VC metadata
    expect(screen.getByText("settings_vc_title")).toBeInTheDocument();

    // It should render the parsed JSON metadata
    expect(screen.getByText(/provider/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pi/i).length).toBeGreaterThan(0);
  });
});
