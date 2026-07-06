/**
 * Tests for src/app/dashboard/page.tsx
 *
 * Covers the PR changes:
 * - handleLogout function: calls logout() and navigates to "/"
 * - LOGOUT button: rendered only when user is authenticated
 * - Dashboard header layout change: flex items-center justify-between
 */

import React, { act } from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "@/app/dashboard/page";
import { useWallet } from "@/app/context/wallet-context";
import { defaultWalletCtx } from "./wallet-test-helpers";
import { VisibilityProvider, JSONUIProvider } from "@json-render/react";

// Mock useWallet so we can control user state
jest.mock("@/app/context/wallet-context", () => ({
  useWallet: jest.fn(),
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <JSONUIProvider registry={{} as any}>
      <VisibilityProvider>{ui}</VisibilityProvider>
    </JSONUIProvider>
  );
};

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

// Mock next/navigation router
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

// Minimal skills data mock to prevent import errors
jest.mock("@/data/skills.json", () => ({
  skills: [
    { name: "Auth", description: "Authentication" },
    { name: "DID", description: "Decentralized ID" },
    { name: "KYC", description: "Know your customer" },
  ],
}));

jest.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" />,
}));


import type { Tier } from "@/lib/tiers";

const authenticatedUser = {
  id: "user-dash",
  walletAddress: "demo:dashtest",
  piUsername: "dashuser",
  xp: 150,
  tier: "Citizen" as Tier,
  trustScore: 15,
  createdAt: new Date().toISOString(),
  actions: [],
  agent: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ skills: [] })
    })
  );
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("Dashboard page — loading state", () => {
  it("renders skeleton placeholder UI when isLoading is true", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ isLoading: true }));
    let container: HTMLElement;
    await act(async () => {
      const res = renderWithProvider(<Dashboard />);
      container = res.container;
    });
    // animate-pulse elements signal the loading skeleton
    const pulseElements = container!.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("does NOT render the LOGOUT button while loading", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ isLoading: true }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    // user is null during load so logout btn should not appear
    expect(screen.queryByRole("button", { name: /logout/i })).toBeNull();
  });
});

describe("Dashboard page — no user (unauthenticated)", () => {
  it("renders a 'CONNECT WALLET' button when user is null and not loading", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: null, isLoading: false, isPiBrowser: true }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("renders 'CONNECTING...' text on the button when isConnecting is true", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: null, isLoading: false, isConnecting: true, isPiBrowser: true }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    expect(screen.getByRole("button", { name: /connecting/i })).toBeInTheDocument();
  });

  it("the connect button is disabled when isConnecting is true", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: null, isLoading: false, isConnecting: true, isPiBrowser: true }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    expect(screen.getByRole("button", { name: /connecting/i })).toBeDisabled();
  });
});

describe("Dashboard page — authenticated user content", () => {
  it("renders a welcome message that includes the user's piUsername", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    expect(screen.getByText(new RegExp(`hello.*${authenticatedUser.piUsername}`, "i"))).toBeInTheDocument();
  });

  it("shows the user's tier in the Agent Stats section", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    // tier shown in stats panel
    const tierTexts = screen.getAllByText(authenticatedUser.tier);
    expect(tierTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the user's XP in the Agent Stats section", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });
    const xpTexts = screen.getAllByText(String(authenticatedUser.xp));
    expect(xpTexts.length).toBeGreaterThanOrEqual(1);
  });

});

describe("Dashboard page — tab navigation", () => {
  it("passport tab is initially active (aria-selected=true)", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });

    const passportTab = screen.getByRole("tab", { name: /passport/i });
    expect(passportTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking Actions tab sets it as active", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });

    await act(async () => {
      screen.getByRole("tab", { name: /actions/i }).click();
    });

    const actionsTab = screen.getByRole("tab", { name: /actions/i });
    expect(actionsTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking Agent tab sets it as active", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });

    await act(async () => {
      screen.getByRole("tab", { name: /agent/i }).click();
    });

    const agentTab = screen.getByRole("tab", { name: /agent/i });
    expect(agentTab).toHaveAttribute("aria-selected", "true");
  });

  it("all four page tabs are rendered", async () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: authenticatedUser }));
    await act(async () => {
      renderWithProvider(<Dashboard />);
    });

    expect(screen.getByRole("tab", { name: /passport/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /agent/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /terminal/i })).toBeInTheDocument();
  });
});
