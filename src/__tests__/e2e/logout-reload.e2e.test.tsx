import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { WalletProvider, useWallet } from "@/app/context/wallet-context";

jest.mock("@/lib/pi-sdk", () => {
  const actual = jest.requireActual("@/lib/pi-sdk");
  return {
    ...actual,
    connectPi: jest.fn(),
  };
});

function LogoutFlowHarness({ onUpdate }: { onUpdate: (value: ReturnType<typeof useWallet>) => void }) {
  const wallet = useWallet();

  React.useEffect(() => {
    onUpdate(wallet);
  }, [wallet, onUpdate]);

  return (
    <div>
      <span data-testid="auth-state">{wallet.user ? "signed-in" : "signed-out"}</span>
      <button type="button" onClick={wallet.logout}>Logout</button>
    </div>
  );
}

describe("E2E logout persistence flow", () => {
  const originalUserAgent = window.navigator.userAgent;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    delete (window as Window & { Pi?: unknown }).Pi;
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });

    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("does not restore a user after logout followed by a full provider reload", async () => {
    localStorage.setItem("axiomid_wallet", "demo:e2e-logout");
    localStorage.setItem("pi_access_token", "e2e-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: "e2e-user",
        walletAddress: "demo:e2e-logout",
        xp: 210,
        tier: "Citizen",
        trustScore: 21,
        createdAt: "2026-01-01T00:00:00.000Z",
        piUsername: "e2elogout",
        agent: null,
      }),
    });

    let contextValue: ReturnType<typeof useWallet> | undefined;
    const { getByRole, getByTestId, unmount } = render(
      <WalletProvider>
        <LogoutFlowHarness onUpdate={(value) => { contextValue = value; }} />
      </WalletProvider>
    );

    await waitFor(() => expect(getByTestId("auth-state")).toHaveTextContent("signed-in"));
    expect(contextValue?.user?.walletAddress).toBe("demo:e2e-logout");

    act(() => {
      getByRole("button", { name: /logout/i }).click();
    });

    await waitFor(() => expect(getByTestId("auth-state")).toHaveTextContent("signed-out"));
    expect(localStorage.getItem("axiomid_wallet")).toBeNull();
    expect(localStorage.getItem("pi_access_token")).toBeNull();

    unmount();
    mockFetch.mockClear();

    render(
      <WalletProvider>
        <LogoutFlowHarness onUpdate={(value) => { contextValue = value; }} />
      </WalletProvider>
    );

    await waitFor(() => expect(contextValue?.isLoading).toBe(false));
    expect(contextValue?.user).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
