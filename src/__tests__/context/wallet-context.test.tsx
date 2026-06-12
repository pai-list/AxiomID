import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { WalletProvider, useWallet } from "@/app/context/wallet-context";
import { connectPi } from "@/lib/pi-sdk";

// Mock the pi-sdk connectPi function
jest.mock("@/lib/pi-sdk", () => {
  const actual = jest.requireActual("@/lib/pi-sdk");
  return {
    ...actual,
    connectPi: jest.fn(),
  };
});

const mockConnectPi = connectPi as jest.MockedFunction<typeof connectPi>;

// A helper component to consume and expose the wallet context for testing assertions
function TestConsumer({
  onUpdate,
}: {
  onUpdate: (value: ReturnType<typeof useWallet>) => void;
}) {
  const wallet = useWallet();
  React.useEffect(() => {
    onUpdate(wallet);
  }, [wallet, onUpdate]);

  return (
    <div>
      <div data-testid="status">{wallet.isLoading ? "loading" : "idle"}</div>
      <div data-testid="user">
        {wallet.user ? wallet.user.walletAddress : "no-user"}
      </div>
      <button data-testid="connect-btn" onClick={wallet.connectWallet}>
        Connect
      </button>
    </div>
  );
}

describe("WalletProvider & WalletContext", () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalSandboxEnv = process.env.NEXT_PUBLIC_PI_SANDBOX;
  const originalDemoWalletEnv = process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete (window as any).Pi;
    process.env.NEXT_PUBLIC_PI_SANDBOX = "false";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "false";

    // Reset User Agent
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });

    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NEXT_PUBLIC_PI_SANDBOX = originalSandboxEnv;
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = originalDemoWalletEnv;
  });

  const setUserAgent = (ua: string) => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: ua,
      configurable: true,
    });
  };

  it("renders with default state for external browsers when no credentials are saved", async () => {
    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(contextValue.isLoading).toBe(false);
    });

    expect(contextValue.user).toBeNull();
    expect(contextValue.isPiBrowser).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks demo wallet creation outside Pi Browser when demo mode is disabled", async () => {
    let contextValue: any;
    const { getByTestId } = render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      getByTestId("connect-btn").click();
    });

    await waitFor(() => expect(contextValue.isConnecting).toBe(false));

    expect(contextValue.error).toBe("افتح التطبيق من Pi Browser");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
  });

  it("calls Pi.init if window.Pi is defined on mount", async () => {
    const mockInit = jest.fn();
    (window as any).Pi = {
      init: mockInit,
      // Do not mock authenticate so we don't trigger auto-connect
    };

    render(
      <WalletProvider>
        <div>Test</div>
      </WalletProvider>,
    );

    expect(mockInit).toHaveBeenCalledWith({
      version: "2.0",
      sandbox: false,
    });
  });

  it("calls Pi.init with sandbox=true when NEXT_PUBLIC_PI_SANDBOX is true", async () => {
    process.env.NEXT_PUBLIC_PI_SANDBOX = "true";
    const mockInit = jest.fn();
    (window as any).Pi = {
      init: mockInit,
    };

    render(
      <WalletProvider>
        <div>Test</div>
      </WalletProvider>,
    );

    expect(mockInit).toHaveBeenCalledWith({
      version: "2.0",
      sandbox: true,
    });
  });

  it("restores user status via API if external browser has saved credentials in localStorage", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    localStorage.setItem("axiomid_wallet", "demo:wallet123");
    localStorage.setItem("pi_access_token", "token123");

    const mockUserResponse = {
      userId: "user-123",
      walletAddress: "demo:wallet123",
      xp: 150,
      tier: "Bronze",
      trustScore: 85,
      createdAt: new Date().toISOString(),
      piUsername: "testuser",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserResponse,
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    // Should fetch from user status endpoint
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/user/status?walletAddress=demo:wallet123",
      );
      expect(contextValue.isLoading).toBe(false);
    });

    expect(contextValue.user).not.toBeNull();
    expect(contextValue.user.walletAddress).toBe("demo:wallet123");
    expect(contextValue.user.piUsername).toBe("testuser");
  });

  it("performs silent auto-connect on mount if inside Pi Browser user-agent", async () => {
    // Simulate Pi Browser user agent
    setUserAgent("Pi Browser; Android; minepi");

    // Set up connectPi mock
    mockConnectPi.mockResolvedValueOnce({
      token: "pi-token-456",
      user: {
        uid: "pi-uid-456",
        username: "pibrowseruser",
        name: "Pi Browser User",
        wallet_address: "GSTELLAR123",
      },
      stellarAddress: "GSTELLAR123",
    });

    // Mock authentication verify request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-pi-456",
        walletAddress: "pi:pi-uid-456",
        xp: 10,
        tier: "Beginner",
        piUsername: "pibrowseruser",
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    // Should auto-connect and wait until isLoading is false
    await waitFor(() => {
      expect(contextValue.isLoading).toBe(false);
    });

    expect(mockConnectPi).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/pi",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(contextValue.user).not.toBeNull();
    expect(contextValue.user.walletAddress).toBe("pi:pi-uid-456");
    expect(contextValue.user.piUsername).toBe("pibrowseruser");
    expect(localStorage.getItem("pi_access_token")).toBe("pi-token-456");
    expect(localStorage.getItem("axiomid_wallet")).toBe("pi:pi-uid-456");
  });

  it("leaves user null and sets isLoading=false when API returns non-ok on restore", async () => {
    localStorage.setItem("axiomid_wallet", "demo:badwallet");
    localStorage.setItem("pi_access_token", "bad-token");

    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(contextValue.isLoading).toBe(false);
    });

    expect(contextValue.user).toBeNull();
  });

  it("leaves user null and sets isLoading=false when API throws on restore", async () => {
    localStorage.setItem("axiomid_wallet", "demo:errwallet");
    localStorage.setItem("pi_access_token", "err-token");

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(contextValue.isLoading).toBe(false);
    });

    expect(contextValue.user).toBeNull();
  });

  it("does not call Pi.init when window.Pi is not defined", async () => {
    // window.Pi is deleted in beforeEach — just confirm no error and no fetch calls
    render(
      <WalletProvider>
        <div>Test</div>
      </WalletProvider>,
    );

    // No assertion failure means Pi.init was not called (no window.Pi)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("connectWallet in external browser creates a demo wallet and stores it in localStorage", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    // Respond to the /api/auth/connect request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          userId: "demo-user-1",
          walletAddress: "demo:abc12345",
          xp: 0,
          tier: "Visitor",
          trustScore: 0,
          createdAt: new Date().toISOString(),
          piUsername: null,
          actions: [],
          agent: null,
        },
      }),
    });

    let contextValue: any;
    const { getByTestId } = render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      getByTestId("connect-btn").click();
    });

    await waitFor(() => expect(contextValue.isConnecting).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/connect",
      expect.objectContaining({ method: "POST" }),
    );
    expect(localStorage.getItem("axiomid_wallet")).toMatch(/^demo:/);
    expect(contextValue.user).not.toBeNull();
  });

  it("connectWallet reuses existing demo wallet from localStorage", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    localStorage.setItem("axiomid_wallet", "demo:existing1");

    // Restore call from initRef useEffect
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "existing-user",
        walletAddress: "demo:existing1",
        xp: 0,
        tier: "Visitor",
        trustScore: 0,
        createdAt: new Date().toISOString(),
        piUsername: null,
        agent: null,
      }),
    });

    // The connect call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          userId: "existing-user",
          walletAddress: "demo:existing1",
          xp: 0,
          tier: "Visitor",
          trustScore: 0,
          createdAt: new Date().toISOString(),
          piUsername: null,
          actions: [],
          agent: null,
        },
      }),
    });

    let contextValue: any;
    const { getByTestId } = render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      getByTestId("connect-btn").click();
    });

    await waitFor(() => expect(contextValue.isConnecting).toBe(false));

    // The connect call should have used the existing "demo:existing1" address
    const connectCall = mockFetch.mock.calls.find(
      (call) => call[0] === "/api/auth/connect",
    );
    expect(connectCall).toBeDefined();
    const body = JSON.parse(connectCall![1].body);
    expect(body.walletAddress).toBe("demo:existing1");
  });

  it("connectWallet in Pi Browser falls back to demo wallet when connectPi throws NOT_IN_PI_BROWSER", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    setUserAgent("Pi Browser; Android; minepi");

    mockConnectPi.mockRejectedValueOnce(new Error("NOT_IN_PI_BROWSER"));

    // auto-connect attempt from initRef (Pi browser path) will call connectWallet
    // connectWallet -> connectPi throws -> falls back to demo
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          userId: "fallback-demo-user",
          walletAddress: "demo:fallbackx",
          xp: 0,
          tier: "Visitor",
          trustScore: 0,
          createdAt: new Date().toISOString(),
          piUsername: null,
          actions: [],
          agent: null,
        },
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/connect",
      expect.objectContaining({ method: "POST" }),
    );
    expect(localStorage.getItem("axiomid_wallet")).toMatch(/^demo:/);
    expect(contextValue.user).not.toBeNull();
  });

  it("isPiBrowser is true when window.Pi.authenticate is defined", async () => {
    // window.Pi.authenticate present triggers checkPiBrowser to return true
    (window as any).Pi = {
      authenticate: jest.fn(),
      init: jest.fn(),
    };

    // Pi browser path: auto-connect runs
    mockConnectPi.mockResolvedValueOnce({
      token: "pi-auth-token",
      user: {
        uid: "pi-uid-auth",
        username: "authuser",
        name: "Auth User",
        wallet_address: null,
      },
      stellarAddress: null,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-auth",
        walletAddress: "pi:pi-uid-auth",
        xp: 5,
        tier: "Visitor",
        piUsername: "authuser",
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isPiBrowser).toBe(true);
  });

  it("useWallet throws when used outside WalletProvider", () => {
    // Suppress React's error boundary output
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function Naked() {
      useWallet();
      return null;
    }

    expect(() => render(<Naked />)).toThrow(
      "useWallet must be used within a WalletProvider",
    );

    consoleError.mockRestore();
  });

  it("buildUserFromApiData uses fallback stellarAddress when API data lacks it", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    localStorage.setItem("axiomid_wallet", "demo:stellartest");
    localStorage.setItem("pi_access_token", "tok");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-stellar",
        walletAddress: "demo:stellartest",
        // no stellarAddress in API response
        xp: 50,
        tier: "Visitor",
        // no trustScore in API response — should compute from xp
        createdAt: "2025-01-01T00:00:00.000Z",
        piUsername: "stellaruser",
        agent: null,
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // trustScore should be computed as Math.min(100, floor(50/10)) = 5
    expect(contextValue.user.trustScore).toBe(5);
    expect(contextValue.user.stellarAddress).toBeNull();
    expect(contextValue.user.createdAt).toBe("2025-01-01T00:00:00.000Z");
  });

  it("buildUserFromApiData uses explicit trustScore from API when provided", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    localStorage.setItem("axiomid_wallet", "demo:trusttest");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-trust",
        walletAddress: "demo:trusttest",
        xp: 200,
        tier: "Bronze",
        trustScore: 77,
        createdAt: new Date().toISOString(),
        piUsername: "trustuser",
        agent: null,
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // trustScore should be taken from API, not computed from xp
    expect(contextValue.user.trustScore).toBe(77);
  });

  // -------------------------------------------------------------------------
  // Tests for new PR additions: isDemoWallet, isDemoWalletEnabled, getStoredWallet
  // -------------------------------------------------------------------------

  it("isDemoWallet is true when the logged-in user has a demo: wallet address", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";
    localStorage.setItem("axiomid_wallet", "demo:democheck");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-demo",
        walletAddress: "demo:democheck",
        xp: 0,
        tier: "Visitor",
        trustScore: 0,
        createdAt: new Date().toISOString(),
        piUsername: null,
        agent: null,
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isDemoWallet).toBe(true);
    expect(contextValue.user.walletAddress).toMatch(/^demo:/);
  });

  it("isDemoWallet is false when the logged-in user has a pi: wallet address", async () => {
    setUserAgent("Pi Browser; Android; minepi");

    mockConnectPi.mockResolvedValueOnce({
      token: "pi-token-nodemo",
      user: {
        uid: "pi-uid-nodemo",
        username: "nodemouser",
        name: "No Demo User",
        wallet_address: null,
      },
      stellarAddress: null,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "user-pi-nodemo",
        walletAddress: "pi:pi-uid-nodemo",
        xp: 0,
        tier: "Visitor",
        piUsername: "nodemouser",
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isDemoWallet).toBe(false);
    expect(contextValue.user.walletAddress).toBe("pi:pi-uid-nodemo");
  });

  it("isDemoWalletEnabled is true when NEXT_PUBLIC_ENABLE_DEMO_WALLET=true", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isDemoWalletEnabled).toBe(true);
  });

  it("isDemoWalletEnabled is false when NEXT_PUBLIC_ENABLE_DEMO_WALLET=false", async () => {
    // Default in beforeEach is already false
    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isDemoWalletEnabled).toBe(false);
  });

  it("getStoredWallet strips demo: wallet from localStorage and does not fetch when demo mode is disabled", async () => {
    // demo mode disabled (default in beforeEach)
    // Pre-populate localStorage with a demo wallet from a previous session
    localStorage.setItem("axiomid_wallet", "demo:stale123");

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // The stale demo wallet should have been removed from localStorage
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
    // No API call should have been made since the wallet was stripped
    expect(mockFetch).not.toHaveBeenCalled();
    // User should remain null
    expect(contextValue.user).toBeNull();
  });

  it("getStoredWallet retains non-demo wallet address when demo mode is disabled", async () => {
    // Even with demo mode disabled, a pi: wallet stored in localStorage should be retained
    // and trigger a status restore fetch
    localStorage.setItem("axiomid_wallet", "pi:realuser1");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "real-user-1",
        walletAddress: "pi:realuser1",
        xp: 50,
        tier: "Visitor",
        trustScore: 5,
        createdAt: new Date().toISOString(),
        piUsername: "realuser",
        agent: null,
      }),
    });

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(localStorage.getItem("axiomid_wallet")).toBe("pi:realuser1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/user/status?walletAddress=pi:realuser1",
    );
    expect(contextValue.user).not.toBeNull();
  });

  it("connectWallet in Pi Browser with NOT_IN_PI_BROWSER error and demo disabled sets Arabic error", async () => {
    // demo mode disabled (default in beforeEach)
    setUserAgent("Pi Browser; Android; minepi");

    // connectPi throws NOT_IN_PI_BROWSER during auto-connect
    mockConnectPi.mockRejectedValueOnce(new Error("NOT_IN_PI_BROWSER"));

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // Should have set the Arabic error message instead of falling back to demo
    expect(contextValue.error).toBe("افتح التطبيق من Pi Browser");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
  });

  it("initial isLoading is false when only pi_access_token is stored but no wallet", async () => {
    // Only token stored, no wallet — the new early-return path should set isLoading=false
    // without making any fetch calls
    localStorage.setItem("pi_access_token", "orphan-token");

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.user).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Additional regression / boundary tests
  // -------------------------------------------------------------------------

  it("connectWallet in external browser (demo enabled): sets error when /api/auth/connect returns non-ok", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";

    // /api/auth/connect returns a server error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    let contextValue: any;
    const { getByTestId } = render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      getByTestId("connect-btn").click();
    });

    await waitFor(() => expect(contextValue.isConnecting).toBe(false));

    // connectDemoWallet throws "Demo auth failed" → connectWallet catches and sets error
    expect(contextValue.error).toBe("Demo auth failed");
    expect(contextValue.user).toBeNull();
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
  });

  it("connectWallet in Pi Browser sets error when connectPi throws a generic (non-NOT_IN_PI_BROWSER) error", async () => {
    setUserAgent("Pi Browser; Android; minepi");

    // connectPi throws a generic network error (not NOT_IN_PI_BROWSER)
    mockConnectPi.mockRejectedValueOnce(new Error("Pi SDK network timeout"));

    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // The generic error should be propagated to context.error
    expect(contextValue.error).toBe("Pi SDK network timeout");
    expect(contextValue.isConnecting).toBe(false);
    expect(contextValue.user).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("isDemoWallet is false when no user is connected (user is null)", async () => {
    // No stored wallet, no Pi Browser — user remains null
    let contextValue: any;
    render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.user).toBeNull();
    expect(contextValue.isDemoWallet).toBe(false);
  });

  it("connectWallet clears the previous error before a new connection attempt", async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_WALLET = "true";

    // First attempt: fail
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    let contextValue: any;
    const { getByTestId } = render(
      <WalletProvider>
        <TestConsumer
          onUpdate={(val) => {
            contextValue = val;
          }}
        />
      </WalletProvider>,
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      getByTestId("connect-btn").click();
    });
    await waitFor(() => expect(contextValue.isConnecting).toBe(false));
    expect(contextValue.error).not.toBeNull();

    // Second attempt: succeed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          userId: "demo-retry",
          walletAddress: "demo:retry1",
          xp: 0,
          tier: "Visitor",
          trustScore: 0,
          createdAt: new Date().toISOString(),
          piUsername: null,
          actions: [],
          agent: null,
        },
      }),
    });

    await act(async () => {
      getByTestId("connect-btn").click();
    });
    await waitFor(() => expect(contextValue.isConnecting).toBe(false));

    // Error should have been cleared before the second attempt resolved
    expect(contextValue.error).toBeNull();
    expect(contextValue.user).not.toBeNull();
  });
});
