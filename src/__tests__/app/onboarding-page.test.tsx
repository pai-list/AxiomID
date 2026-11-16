/**
 * Tests for src/app/onboarding/page.tsx
 *
 * Agent activation is gated server-side on KYC verification (or a completed
 * activation payment). The wizard must therefore only provision the agent at
 * step 2 and activate it once verification succeeds at step 3, retrying
 * activation if it fails after verification.
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import OnboardingPage from "@/app/onboarding/page";
import { useWallet } from "@/app/context/wallet-context";
import type { User } from "@/app/context/wallet-types";
import { defaultWalletCtx } from "./wallet-test-helpers";

jest.mock("@/app/context/wallet-context", () => ({
  useWallet: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

jest.mock("@/components/Header", () => {
  const Header = () => null;
  Header.displayName = "Header";
  return Header;
});
jest.mock("@/components/Footer", () => {
  const Footer = () => null;
  Footer.displayName = "Footer";
  return Footer;
});
jest.mock("@/components/ui/InteractivePassportCard", () => {
  const InteractivePassportCard = () => null;
  InteractivePassportCard.displayName = "InteractivePassportCard";
  return InteractivePassportCard;
});
jest.mock("@/components/os/GoogleConnectButton", () => ({
  GoogleConnectButton: () => null,
}));

import { logger } from "@/lib/logger";
const loggerErrorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

afterAll(() => {
  loggerErrorSpy.mockRestore();
});

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockFetch = jest.fn();

const firstTimeUser: User = {
  id: "user-onboarding",
  walletAddress: "GABC1234567890abcdef",
  piUsername: "newpioneer",
  kycStatus: "NONE",
  xp: 0,
  tier: "Citizen",
  trustScore: 0,
  stamps: [],
  actions: [],
  agent: null,
  createdAt: new Date().toISOString(),
};

function kycResponse(kycStatus: string) {
  return {
    ok: true,
    json: () => Promise.resolve({ kycStatus, uid: "pi-uid-123", computedTrustScore: 80 }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue(kycResponse("VERIFIED"));
  global.fetch = mockFetch as unknown as typeof fetch;
});

/**
 * Walks a first-time user through step 1 (connect) and step 2 (provision)
 * so the wizard lands on step 3 (verification).
 */
async function navigateToStep3(overrides: Partial<ReturnType<typeof useWallet>> = {}) {
  const ctx = defaultWalletCtx({
    user: firstTimeUser,
    createAgent: jest.fn().mockResolvedValue(true),
    activateAgent: jest.fn().mockResolvedValue(true),
    ...overrides,
  });
  mockUseWallet.mockReturnValue(ctx);
  render(<OnboardingPage />);

  fireEvent.click(screen.getByRole("button", { name: /onboarding_continue/ }));
  expect(screen.getByText("onboarding_step2_title")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("onboarding_agent_name_label"), {
    target: { value: "Scout" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /onboarding_provision_btn/ }));
  });

  await waitFor(() => expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument());
  return ctx;
}

describe("OnboardingPage — step 2 provisioning", () => {
  it("creates the agent without activating it and advances to verification", async () => {
    const ctx = await navigateToStep3();

    expect(ctx.createAgent).toHaveBeenCalledWith("Scout");
    expect(ctx.activateAgent).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("stays on step 2 and shows an error when agent creation fails", async () => {
    const activateAgent = jest.fn().mockResolvedValue(true);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: firstTimeUser,
        createAgent: jest.fn().mockResolvedValue(false),
        activateAgent,
      }),
    );
    render(<OnboardingPage />);

    fireEvent.click(screen.getByRole("button", { name: /onboarding_continue/ }));
    fireEvent.change(screen.getByLabelText("onboarding_agent_name_label"), {
      target: { value: "Scout" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_provision_btn/ }));
    });

    expect(mockToastError).toHaveBeenCalledWith("onboarding_agent_failed");
    expect(activateAgent).not.toHaveBeenCalled();
    expect(screen.getByText("onboarding_step2_title")).toBeInTheDocument();
  });
});

describe("OnboardingPage — step 3 verification and activation", () => {
  it("activates the agent after KYC verification succeeds and advances to step 4", async () => {
    const ctx = await navigateToStep3();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_seal_btn/ }));
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/pi/kya/verify", expect.objectContaining({ method: "POST" }));
    expect(ctx.activateAgent).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
  });

  it("does not activate the agent when KYC is still pending", async () => {
    mockFetch.mockResolvedValue(kycResponse("PENDING"));
    const ctx = await navigateToStep3();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_seal_btn/ }));
    });

    expect(ctx.activateAgent).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith("KYC verification pending");
    expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument();
  });

  it("does not activate the agent when the verification request fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const ctx = await navigateToStep3();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_seal_btn/ }));
    });

    expect(ctx.activateAgent).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith("Verification failed");
    expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument();
  });

  it("retries activation via Continue without re-verifying when activation fails after KYC succeeds", async () => {
    const activateAgent = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await navigateToStep3({ activateAgent });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_seal_btn/ }));
    });

    expect(activateAgent).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith("onboarding_agent_failed");
    expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    });

    expect(activateAgent).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
  });

  it("activates the agent when an already-verified user continues from step 3", async () => {
    const ctx = await navigateToStep3({ user: { ...firstTimeUser, kycStatus: "VERIFIED" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(ctx.activateAgent).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
  });
});

describe("OnboardingPage — returning users", () => {
  it("lands a verified user with an inactive agent on step 3 so activation can be retried", async () => {
    const activateAgent = jest.fn().mockResolvedValue(true);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: {
          ...firstTimeUser,
          kycStatus: "VERIFIED",
          agent: { id: "agent-1", name: "Scout", status: "INACTIVE", lastActive: null },
        },
        activateAgent,
      }),
    );
    render(<OnboardingPage />);

    await waitFor(() => expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    });

    expect(activateAgent).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
  });

  it("skips to step 4 without re-activating a verified user whose agent is already active", async () => {
    const activateAgent = jest.fn().mockResolvedValue(true);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: {
          ...firstTimeUser,
          kycStatus: "VERIFIED",
          agent: { id: "agent-1", name: "Scout", status: "ACTIVE", lastActive: null },
        },
        activateAgent,
      }),
    );
    render(<OnboardingPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
    expect(activateAgent).not.toHaveBeenCalled();
  });

  it("does not call activateAgent again when an unverified user's agent is already active", async () => {
    const activateAgent = jest.fn().mockResolvedValue(true);
    mockUseWallet.mockReturnValue(
      defaultWalletCtx({
        user: {
          ...firstTimeUser,
          agent: { id: "agent-1", name: "Scout", status: "ACTIVE", lastActive: null },
        },
        activateAgent,
      }),
    );
    render(<OnboardingPage />);

    await waitFor(() => expect(screen.getByText("onboarding_step3_title")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /onboarding_seal_btn/ }));
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(activateAgent).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /onboarding_enter_dashboard/ })).toBeInTheDocument(),
    );
  });
});
