/**
 * Tests for src/app/dashboard/page.tsx
 *
 * Covers the new behaviour introduced in this PR:
 *  - shouldShowPiBrowserPrompt  (!isPiBrowser && !isDemoWalletEnabled)
 *  - Demo Account banner when isDemoWallet === true
 *  - error display when shouldShowPiBrowserPrompt is false and error is set
 *  - "Agent" fallback when piUsername is null
 *  - connect-button disabled states (isConnecting, shouldShowPiBrowserPrompt)
 *  - isLoading skeleton
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "@/app/dashboard/page";

// Mock useWallet so we fully control the context values the component receives
jest.mock("@/app/context/wallet-context", () => ({
  useWallet: jest.fn(),
}));

import { useWallet } from "@/app/context/wallet-context";
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

/** Build a default wallet context, allowing partial overrides. */
function defaultWalletCtx(
  overrides: Partial<ReturnType<typeof useWallet>> = {},
): ReturnType<typeof useWallet> {
  return {
    user: null,
    isLoading: false,
    isConnecting: false,
    error: null,
    isPiBrowser: false,
    isDemoWallet: false,
    isDemoWalletEnabled: true, // enabled by default so tests that check connect flow work naturally
    connectWallet: jest.fn(),
    claimAction: jest.fn(),
    refreshUser: jest.fn(),
    createAgent: jest.fn(),
    activateAgent: jest.fn(),
    pauseAgent: jest.fn(),
    levelProgress: 0,
    nextXP: null,
    walletLogs: [],
    runWalletTest: jest.fn(),
    clearWalletLogs: jest.fn(),
    ...overrides,
  } as any;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

describe("Dashboard — loading state", () => {
  it("renders skeleton cards and no connect button while isLoading is true", () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ isLoading: true }));
    render(<Dashboard />);

    // The connect button and the welcome headings should not be visible
    expect(screen.queryByText("CONNECT WALLET")).not.toBeInTheDocument();
    expect(screen.queryByText("Welcome to AxiomID")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// No-user connect screen — demo wallet enabled, outside Pi Browser
// ---------------------------------------------------------------------------

describe("Dashboard — unauthenticated, demo wallet enabled", () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({ isDemoWalletEnabled: true, isPiBrowser: false }),
    );
  });

  it("shows the 'Welcome to AxiomID' heading", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: /Welcome to AxiomID/i }),
    ).toBeInTheDocument();
  });

  it("renders an enabled 'CONNECT WALLET' button", () => {
    render(<Dashboard />);
    const btn = screen.getByRole("button", { name: /CONNECT WALLET/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("does NOT show the Pi Browser prompt when demo wallet is enabled", () => {
    render(<Dashboard />);
    expect(
      screen.queryByText("افتح التطبيق من Pi Browser"),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// No-user connect screen — demo wallet DISABLED, outside Pi Browser
// ---------------------------------------------------------------------------

describe("Dashboard — unauthenticated, demo wallet disabled, not in Pi Browser", () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: false,
        isPiBrowser: false,
        error: null,
      }),
    );
  });

  it("shows the Arabic Pi Browser prompt", () => {
    render(<Dashboard />);
    expect(
      screen.getByText("افتح التطبيق من Pi Browser"),
    ).toBeInTheDocument();
  });

  it("renders a disabled 'CONNECT WALLET' button", () => {
    render(<Dashboard />);
    const btn = screen.getByRole("button", { name: /CONNECT WALLET/i });
    expect(btn).toBeDisabled();
  });

  it("shows the sub-message explaining demo wallet is disabled", () => {
    render(<Dashboard />);
    expect(
      screen.getByText(/Demo wallet is disabled for this deployment/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// No-user connect screen — demo wallet enabled but error set
// ---------------------------------------------------------------------------

describe("Dashboard — unauthenticated, demo enabled, error set", () => {
  it("shows the error message when shouldShowPiBrowserPrompt is false but error is truthy", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: true,
        isPiBrowser: false,
        error: "افتح التطبيق من Pi Browser",
      }),
    );
    render(<Dashboard />);
    expect(
      screen.getByText("افتح التطبيق من Pi Browser"),
    ).toBeInTheDocument();
  });

  it("does NOT show the amber Pi Browser prompt when demo is enabled even if error is set", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: true,
        isPiBrowser: false,
        error: "some error",
      }),
    );
    render(<Dashboard />);
    // The amber prompt only appears when shouldShowPiBrowserPrompt is true
    expect(
      screen.queryByText(/Demo wallet is disabled for this deployment/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// No-user connect screen — isConnecting
// ---------------------------------------------------------------------------

describe("Dashboard — unauthenticated, isConnecting=true", () => {
  it("shows 'CONNECTING...' text and the button is disabled", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({ isDemoWalletEnabled: true, isConnecting: true }),
    );
    render(<Dashboard />);
    const btn = screen.getByRole("button", { name: /CONNECTING\.\.\./i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Authenticated user — demo wallet
// ---------------------------------------------------------------------------

describe("Dashboard — authenticated, demo wallet", () => {
  const demoUser = {
    id: "demo-user-1",
    walletAddress: "demo:abc12345",
    piUsername: "demouser",
    xp: 42,
    tier: "Visitor" as any,
    trustScore: 4,
    createdAt: new Date().toISOString(),
    actions: [],
    agent: null,
  };

  beforeEach(() => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: demoUser,
        isDemoWallet: true,
        isDemoWalletEnabled: true,
      }),
    );
  });

  it("shows 'Demo Account' banner", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Demo Account/i)).toBeInTheDocument();
  });

  it("shows 'Not valid for production Pi Browser/App Studio use' sub-text", () => {
    render(<Dashboard />);
    expect(
      screen.getByText(/Not valid for production Pi Browser\/App Studio use/i),
    ).toBeInTheDocument();
  });

  it("shows the piUsername in the welcome heading", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: /Welcome back, demouser/i }),
    ).toBeInTheDocument();
  });

  it("displays the XP and tier in the paragraph", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Visitor/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Authenticated user — real Pi wallet (no demo banner)
// ---------------------------------------------------------------------------

describe("Dashboard — authenticated, real Pi wallet", () => {
  const piUser = {
    id: "pi-user-1",
    walletAddress: "pi:piuid123",
    piUsername: "piuser1",
    xp: 200,
    tier: "Citizen" as any,
    trustScore: 20,
    createdAt: new Date().toISOString(),
    actions: [],
    agent: null,
  };

  beforeEach(() => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: piUser,
        isDemoWallet: false,
        isDemoWalletEnabled: false,
        isPiBrowser: true,
      }),
    );
  });

  it("does NOT show the 'Demo Account' banner", () => {
    render(<Dashboard />);
    expect(screen.queryByText(/Demo Account/i)).not.toBeInTheDocument();
  });

  it("shows the piUsername in the welcome heading", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: /Welcome back, piuser1/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Authenticated user — piUsername is null (fallback to "Agent")
// ---------------------------------------------------------------------------

describe("Dashboard — authenticated, piUsername is null", () => {
  const userNoName = {
    id: "anon-user",
    walletAddress: "pi:anon001",
    piUsername: null,
    xp: 0,
    tier: "Visitor" as any,
    trustScore: 0,
    createdAt: new Date().toISOString(),
    actions: [],
    agent: null,
  };

  beforeEach(() => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: userNoName,
        isDemoWallet: false,
        isPiBrowser: true,
      }),
    );
  });

  it("falls back to 'Agent' when piUsername is null", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: /Welcome back, Agent/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// shouldShowPiBrowserPrompt — isPiBrowser=true overrides disabled demo wallet
// ---------------------------------------------------------------------------

describe("Dashboard — in Pi Browser with demo wallet disabled", () => {
  it("does NOT show the Pi Browser prompt when isPiBrowser is true", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: false,
        isPiBrowser: true,
        user: null,
      }),
    );
    render(<Dashboard />);
    // shouldShowPiBrowserPrompt = !isPiBrowser && !isDemoWalletEnabled = false
    expect(
      screen.queryByText("افتح التطبيق من Pi Browser"),
    ).not.toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /CONNECT WALLET/i });
    expect(btn).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Dashboard header is always rendered
// ---------------------------------------------------------------------------

describe("Dashboard — header", () => {
  it("always renders the AxiomID Dashboard header", () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx());
    render(<Dashboard />);
    expect(screen.getByText("AxiomID Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText("Agent Identity Layer v1.0.0"),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Additional regression / boundary tests
// ---------------------------------------------------------------------------

describe("Dashboard — connect button interaction", () => {
  it("calls connectWallet when the connect button is clicked", async () => {
    const connectWallet = jest.fn().mockResolvedValue(undefined);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({ isDemoWalletEnabled: true, connectWallet }),
    );
    render(<Dashboard />);

    screen.getByRole("button", { name: /CONNECT WALLET/i }).click();

    expect(connectWallet).toHaveBeenCalledTimes(1);
  });

  it("does NOT call connectWallet when the button is disabled (shouldShowPiBrowserPrompt=true)", () => {
    const connectWallet = jest.fn().mockResolvedValue(undefined);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: false,
        isPiBrowser: false,
        connectWallet,
      }),
    );
    render(<Dashboard />);

    screen.getByRole("button", { name: /CONNECT WALLET/i }).click();

    // Button is disabled so onClick should not fire
    expect(connectWallet).not.toHaveBeenCalled();
  });
});

describe("Dashboard — footer navigation", () => {
  it("always renders all four footer tabs", () => {
    mockUseWallet.mockReturnValue(defaultWalletCtx());
    render(<Dashboard />);

    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });
});

describe("Dashboard — piUsername edge cases", () => {
  it("falls back to 'Agent' when piUsername is an empty string", () => {
    const userEmptyName = {
      id: "user-empty",
      walletAddress: "pi:emptyname",
      piUsername: "",
      xp: 10,
      tier: "Visitor" as any,
      trustScore: 1,
      createdAt: new Date().toISOString(),
      actions: [],
      agent: null,
    };

    mockUseWallet.mockReturnValue(
      defaultWalletCtx({ user: userEmptyName, isPiBrowser: true }),
    );
    render(<Dashboard />);

    expect(
      screen.getByRole("heading", { name: /Welcome back, Agent/i }),
    ).toBeInTheDocument();
  });
});

describe("Dashboard — error styling", () => {
  it("renders error in red container when shouldShowPiBrowserPrompt is false", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: true,
        isPiBrowser: false,
        error: "Connection failed",
      }),
    );
    render(<Dashboard />);

    const errorEl = screen.getByText("Connection failed");
    expect(errorEl).toBeInTheDocument();
    // The amber Pi Browser prompt should NOT appear alongside a normal error
    expect(
      screen.queryByText(/Demo wallet is disabled for this deployment/i),
    ).not.toBeInTheDocument();
  });

  it("amber prompt takes precedence over error when shouldShowPiBrowserPrompt is true", () => {
    // Even if error is set, shouldShowPiBrowserPrompt=true shows the amber prompt, not the error div
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        isDemoWalletEnabled: false,
        isPiBrowser: false,
        error: "some other error",
      }),
    );
    render(<Dashboard />);

    expect(
      screen.getByText("افتح التطبيق من Pi Browser"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Demo wallet is disabled for this deployment/i),
    ).toBeInTheDocument();
    // The generic error text should NOT appear since the amber block takes priority
    expect(screen.queryByText("some other error")).not.toBeInTheDocument();
  });
});

describe("Dashboard — level progress bar", () => {
  it("renders level progress bar with correct width when levelProgress is set", () => {
    const piUser = {
      id: "prog-user",
      walletAddress: "pi:proguser",
      piUsername: "proguser",
      xp: 150,
      tier: "Citizen" as any,
      trustScore: 15,
      createdAt: new Date().toISOString(),
      actions: [],
      agent: null,
    };

    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: piUser,
        levelProgress: 60,
        isPiBrowser: true,
      }),
    );
    render(<Dashboard />);

    // The progress bar div has an inline style with width
    const progressBar = document.querySelector(
      "[style*='width: 60%']",
    ) as HTMLElement | null;
    expect(progressBar).not.toBeNull();
    expect(progressBar?.style.width).toBe("60%");
  });
});
