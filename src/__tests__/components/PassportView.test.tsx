/**
 * Tests for src/app/passport/[slug]/PassportView.tsx (PR changes)
 *
 * PR changes covered:
 * - Replaced AbortController-based fetch with a self-scheduling polling loop
 *   (fetchPassport) that keeps polling every 3s while jobStatus is neither
 *   "COMPLETED" nor "ACTIVE".
 * - New dedicated loading state (Loader2 spinner) rendered whenever `loading`
 *   is true, independent of `error`/`passport`.
 * - New "Preparing your AI..." intermediate UI shown while the identity job
 *   is still building (jobStatus present and not COMPLETED/ACTIVE).
 * - CTA links now point to "/build" instead of "/".
 */

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { useParams } from "next/navigation";
import { PassportView } from "@/app/passport/[slug]/PassportView";
import { sharePassport } from "@/lib/pi-native-features";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
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

function mockFetchOnce(response: { ok: boolean; json: () => Promise<unknown> }) {
  (global.fetch as jest.Mock).mockResolvedValueOnce(response);
}

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
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch; // never resolves
  });

  it("renders a loading indicator while the fetch is pending", () => {
    render(<PassportView />);
    expect(screen.getByText(/Loading Identity/i)).toBeInTheDocument();
  });

  it("does not render passport or error content while loading", () => {
    render(<PassportView />);
    expect(screen.queryByTestId("agent-passport")).not.toBeInTheDocument();
  });
});

describe("PassportView — no slug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: undefined as unknown as string });
    global.fetch = jest.fn();
  });

  it("does not call fetch when slug is not yet available", () => {
    render(<PassportView />);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("PassportView — successful fetch (no jobStatus / COMPLETED)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "alice" });
    global.fetch = jest.fn();
  });

  it("fetches the passport for the encoded slug", async () => {
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/passport/alice"));
  });

  it("URL-encodes the slug in the fetch request", async () => {
    mockUseParams.mockReturnValue({ slug: "alice bob" });
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/passport/alice%20bob")
    );
  });

  it("renders the AgentPassport once data has loaded", async () => {
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    expect(screen.getByTestId("agent-passport")).toHaveTextContent("alice");
  });

  it("renders the AgentQR with the passport DID", async () => {
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-qr")).toBeInTheDocument());
    expect(screen.getByTestId("agent-qr")).toHaveTextContent("did:axiom:alice");
  });

  it("treats jobStatus 'COMPLETED' as fully loaded (renders passport, not the building UI)", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    expect(screen.queryByText(/Preparing your AI/i)).not.toBeInTheDocument();
  });

  it("treats jobStatus 'ACTIVE' as fully loaded (renders passport, not the building UI)", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "ACTIVE" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    expect(screen.queryByText(/Preparing your AI/i)).not.toBeInTheDocument();
  });

  it("renders CTA links pointing to /build", async () => {
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());
    const buildLinks = screen.getAllByRole("link").filter((el) => el.getAttribute("href") === "/build");
    expect(buildLinks.length).toBeGreaterThan(0);
  });

  it("calls sharePassport with the current URL when the share button is clicked", async () => {
    mockFetchOnce({ ok: true, json: async () => basePassport });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByTestId("agent-passport")).toBeInTheDocument());

    const shareButton = screen.getByText("share_passport");
    await act(async () => {
      fireEvent.click(shareButton);
    });

    expect(sharePassport).toHaveBeenCalledWith(
      expect.objectContaining({ url: window.location.href })
    );
  });
});

describe("PassportView — identity still building (jobStatus not COMPLETED/ACTIVE)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseParams.mockReturnValue({ slug: "alice" });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the 'Preparing your AI...' panel when jobStatus is pending", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText(/Preparing your AI/i)).toBeInTheDocument());
  });

  it("displays the current jobStatus value in the building panel", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText(/Status: PROVISIONING/)).toBeInTheDocument());
  });

  it("does not render the AgentPassport while the job is still building", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText(/Preparing your AI/i)).toBeInTheDocument());
    expect(screen.queryByTestId("agent-passport")).not.toBeInTheDocument();
  });

  it("polls again after 3 seconds while the job is still building", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    render(<PassportView />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }) });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it("stops polling once jobStatus becomes COMPLETED", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    render(<PassportView />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "COMPLETED" }) });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    // Advance well past another poll interval — no further fetches expected.
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("clears the pending poll timeout on unmount", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    mockFetchOnce({ ok: true, json: async () => ({ ...basePassport, jobStatus: "PROVISIONING" }) });
    const { unmount } = render(<PassportView />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

describe("PassportView — fetch error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "missing" });
    global.fetch = jest.fn();
  });

  it("renders an error message when the response is not ok", async () => {
    mockFetchOnce({ ok: false, json: async () => ({ message: "Not found" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
  });

  it("falls back to a generic message when error json cannot be parsed", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("bad json")),
    });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText("passport_not_found")).toBeInTheDocument());
  });

  it("renders an error message when fetch itself rejects (network error)", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network down"));
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText("network down")).toBeInTheDocument());
  });

  it("renders a CTA link to /build on the error screen", async () => {
    mockFetchOnce({ ok: false, json: async () => ({ message: "Not found" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
    const link = screen.getByText("CREATE YOUR PASSPORT");
    expect(link.closest("a")).toHaveAttribute("href", "/build");
  });

  it("stops showing the loading indicator once an error occurs", async () => {
    mockFetchOnce({ ok: false, json: async () => ({ message: "Not found" }) });
    render(<PassportView />);
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
    expect(screen.queryByText(/Loading Identity/i)).not.toBeInTheDocument();
  });
});