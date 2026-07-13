/**
 * Tests for src/app/passport/[slug]/PassportView.tsx (TanStack Query version)
 *
 * Covers:
 * - Loading state with PassportSkeleton
 * - Successful fetch renders AgentPassport + AgentQR
 * - Error states (network, non-ok, parse failure)
 * - Share button interaction
 * - URL encoding for slug
 * - Missing/empty slug (no fetch)
 * - jobStatus PREPARING vs COMPLETED/ACTIVE
 */

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useLanguage } from "@/app/context/language-context";
import { PassportView } from "@/app/passport/[slug]/PassportView";
import { sharePassport } from "@/lib/pi-native-features";

function TestWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

jest.mock("@/lib/pi-native-features", () => ({
  sharePassport: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/AgentPassport", () => ({
  AgentPassport: (props: Record<string, unknown>) => (
    <div data-testid="agent-passport">{String(props.username)}</div>
  ),
}));

jest.mock("@/components/AgentQR", () => ({
  AgentQR: ({ did }: { did: string }) => <div data-testid="agent-qr">{did}</div>,
}));

const mockUseParams = useParams as unknown as jest.Mock;
const mockUseLanguage = useLanguage as unknown as jest.Mock;

const basePassport = {
  username: "alice",
  walletAddress: "pi:alice",
  stellarAddress: null,
  did: "did:axiom:alice",
  tier: "Citizen",
  xp: 100,
  trustScore: 40,
  kyaStatus: "verified",
  kycStatus: "verified",
  stamps: [],
  issuedDate: "2025-01-01T00:00:00.000Z",
  agentName: null,
  agentStatus: null,
};

describe("PassportView — loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "alice" });
    mockUseLanguage.mockReturnValue({ t: (key: string) => key, language: "en" });
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  });

  it("renders a loading skeleton while the fetch is pending", () => {
    render(<PassportView />, { wrapper: TestWrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not render passport or error content while loading", () => {
    render(<PassportView />, { wrapper: TestWrapper });
    expect(screen.queryByTestId("agent-passport")).not.toBeInTheDocument();
  });
});

describe("PassportView — no slug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: undefined as unknown as string });
    mockUseLanguage.mockReturnValue({ t: (key: string) => key, language: "en" });
    global.fetch = jest.fn();
  });

  it("does not call fetch when slug is not yet available", () => {
    render(<PassportView />, { wrapper: TestWrapper });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("PassportView — successful fetch (no jobStatus / COMPLETED)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "alice" });
    mockUseLanguage.mockReturnValue({ t: (key: string) => key, language: "en" });
    global.fetch = jest.fn();
  });

  async function resolvedRender() {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => basePassport,
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
  }

  it("fetches the passport for the encoded slug", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => basePassport,
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/passport/alice"));
  });

  it("renders error state on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Custom API Error" }),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText("passport_not_found")).toBeInTheDocument();
    });

    expect(screen.getByText("Custom API Error")).toBeInTheDocument();
  });

  it("URL-encodes the slug in the fetch request", async () => {
    mockUseParams.mockReturnValue({ slug: "alice bob" });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => basePassport,
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/passport/alice%20bob")
    );
  });

  it("renders the AgentPassport once data has loaded", async () => {
    await resolvedRender();
    expect(screen.getByTestId("agent-passport")).toHaveTextContent("alice");
  });

  it("renders the AgentQR with the passport DID", async () => {
    await resolvedRender();
    expect(screen.getByTestId("agent-qr")).toHaveTextContent("did:axiom:alice");
  });

  it("treats jobStatus COMPLETED as fully loaded", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    expect(screen.queryByText(/Preparing your AI/i)).not.toBeInTheDocument();
  });

  it("treats jobStatus ACTIVE as fully loaded", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "ACTIVE" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    expect(screen.queryByText(/Preparing your AI/i)).not.toBeInTheDocument();
  });

  it("renders CTA links pointing to /claim", async () => {
    await resolvedRender();
    const claimLinks = screen.getAllByRole("link").filter((el) => el.getAttribute("href") === "/claim");
    expect(claimLinks.length).toBeGreaterThan(0);
  });

  it("calls sharePassport when the share button is clicked", async () => {
    await resolvedRender();

    const shareButton = screen.getByText("share_passport");
    await act(async () => {
      fireEvent.click(shareButton);
    });

    expect(sharePassport).toHaveBeenCalledWith(
      expect.objectContaining({ url: window.location.href, title: "share_title", text: "share_text" })
    );
  });
});

describe("PassportView — identity still building (jobStatus not COMPLETED/ACTIVE)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseParams.mockReturnValue({ slug: "alice" });
    mockUseLanguage.mockReturnValue({ t: (key: string) => key, language: "en" });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the Preparing your AI panel when jobStatus is pending", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText(/Preparing your AI/i)).toBeInTheDocument());
  });

  it("displays the current jobStatus value", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText(/Status: PROVISIONING/)).toBeInTheDocument());
  });

  it("does not render the AgentPassport while the job is still building", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    await act(async () => {
      render(<PassportView />, { wrapper: TestWrapper });
      await Promise.resolve();
    });
    expect(screen.queryByTestId("agent-passport")).not.toBeInTheDocument();
  });

  it("polls again after 3 seconds while the job is still building", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    await act(async () => {
      render(<PassportView />, { wrapper: TestWrapper });
      await Promise.resolve();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }),
    });
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stops polling once jobStatus becomes COMPLETED", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    await act(async () => {
      render(<PassportView />, { wrapper: TestWrapper });
      await Promise.resolve();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }),
    });
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("clears the pending poll timeout on unmount", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }),
    });
    let unmount: ReturnType<typeof render>["unmount"];
    await act(async () => {
      unmount = render(<PassportView />, { wrapper: TestWrapper }).unmount;
      await Promise.resolve();
    });
    unmount!();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

describe("PassportView — fetch error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "missing" });
    mockUseLanguage.mockReturnValue({ t: (key: string) => key, language: "en" });
    global.fetch = jest.fn();
  });

  it("renders an error when the response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not found" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
  });

  it("falls back to a generic message when error json cannot be parsed", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("bad json")),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText("passport_not_found")).toBeInTheDocument();
    });
  });

  it("renders error on fetch rejection (network error)", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network down"));
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText("network down")).toBeInTheDocument());
  });

  it("renders a CTA link to /claim on the error screen", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not found" }),
    });
    render(<PassportView />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
    const link = screen.getByText("create_your_passport");
    expect(link.closest("a")).toHaveAttribute("href", "/claim");
  });
});
