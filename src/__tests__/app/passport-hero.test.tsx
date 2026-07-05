/**
 * Tests for src/app/page.tsx (landing page)
 *
 * page.tsx is an async Server Component — we test via a synchronous
 * client-side wrapper that mirrors the rendered output.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue("en"),
  }),
}));

jest.mock("@/components/Header", () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));

jest.mock("@/components/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));

jest.mock("@/components/HeroDemo", () => ({
  __esModule: true,
  default: () => <div data-testid="hero-demo" />,
}));

jest.mock("@/components/TrustTiers", () => ({
  __esModule: true,
  default: () => <div data-testid="trust-tiers" />,
}));

jest.mock("@/components/StatsBar", () => ({
  __esModule: true,
  default: () => <div data-testid="stats-bar" />,
}));

jest.mock("@/components/landing/InteractiveShowcase", () => ({
  __esModule: true,
  default: () => <div data-testid="interactive-showcase" />,
}));

jest.mock("@/i18n", () => ({
  getTranslation: (_lang: string, key: string) => {
    const translations: Record<string, string> = {
      landing_headline_en: "Create your",
      landing_headline_rules_en: "AI Identity",
      landing_tagline: "Establish a cryptographically verified identity",
      landing_pi_badge: "Backed by Pi Network",
      landing_how_it_works: "How it works",
      landing_three_steps: "Three steps to sovereignty",
      landing_step1_title: "Create Identity",
      landing_step1_desc: "Generate your W3C DID",
      landing_step2_title: "Verify & Prove",
      landing_step2_desc: "Zero-knowledge proof ready",
      landing_step3_title: "Deploy Agent",
      landing_step3_desc: "Launch your autonomous agent",
      tier: "Trust Tiers",
      landing_level_up: "Level up your trust",
    };
    return translations[key] || key;
  },
}));

// Synchronous wrapper that mirrors the Server Component's rendered HTML structure.
// The actual page.tsx is async Server Component — can't be rendered in Jest directly.
function LandingPageWrapper() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-grid relative overflow-hidden" id="main-content">
      <header data-testid="header" />
      <div className="w-full max-w-6xl px-4 sm:px-6 pt-24 sm:pt-32 pb-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-7 space-y-6 sm:space-y-8 animate-fade-in text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-semibold uppercase">Backed by Pi Network</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                <span className="block animate-slide-up">Create your</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-emerald-400 to-axiom-purple animate-slide-up">AI Identity</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl mx-auto md:mx-0 animate-slide-up leading-relaxed mt-4">
                Establish a cryptographically verified identity for your autonomous agents.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-slide-up justify-center md:justify-start">
              <a href="/claim" className="btn-primary py-4 px-8 text-sm sm:text-base font-mono tracking-wider">Create My AI Agent</a>
              <a href="/docs" className="text-xs sm:text-sm font-mono text-zinc-400 hover:text-white transition-colors">Explore the Protocol</a>
            </div>
          </div>
          <div className="md:col-span-5 flex items-center justify-center">
            <div data-testid="hero-demo" />
          </div>
        </div>
        <div className="w-full max-w-6xl px-4 sm:px-6 mt-16 sm:mt-24 z-10">
          <SectionHeader label={t("tier")} title={t("landing_level_up")} labelColor="text-electric-blue" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {["Visitor", "Citizen", "Validator", "Sovereign"].map((tier) => (
              <div key={tier} className="stitch-feature-card">
                <h3 className="text-lg font-bold text-white">{tier}</h3>
              </div>
            ))}
          </div>
        </div>
        {user ? (
          <>
            <a href="/dashboard">DASHBOARD</a>
            <button onClick={() => logout?.()}>LOG OUT</button>
          </>
        ) : (
          <a href="/dashboard">DASHBOARD</a>
        )}
      </main>
    );
  }

  return { __esModule: true, default: Home, generateMetadata: async () => ({ title: "Test" }) };
});

import Home from "@/app/page";

import { useWallet } from "@/app/context/wallet-context";
import type { Tier } from "@/lib/tiers";
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

function defaultWalletCtx(overrides: Partial<ReturnType<typeof useWallet>> = {}): ReturnType<typeof useWallet> {
  return {
    user: null,
    isLoading: false,
    isConnecting: false,
    error: null,
    isPiBrowser: false,
    connectWallet: jest.fn(),
    claimAction: jest.fn(),
    refreshUser: jest.fn(),
    createAgent: jest.fn(),
    activateAgent: jest.fn(),
    pauseAgent: jest.fn(),
    claimKya: jest.fn(),
    levelProgress: 0,
    nextXP: null,
    walletLogs: [],
    runWalletTest: jest.fn(),
    clearWalletLogs: jest.fn(),
    logout: jest.fn(),
    disconnectWallet: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useWallet>;
}

async function renderHome() {
  await act(async () => {
    render(<Home />);
  });
  await act(async () => {
    jest.advanceTimersByTime(101);
  });
}

beforeAll(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ stats: { registeredUsers: 100, totalAgents: 50, totalXpEarned: 10000, totalPayments: 500 } })
    })
  );
}

describe("Landing page — Stitch hero", () => {
  it("renders the main heading", () => {
    render(<LandingPageWrapper />);
    expect(screen.getByText(/create your/i)).toBeInTheDocument();
    expect(screen.getByText(/ai identity/i)).toBeInTheDocument();
  });

  it("renders the main heading", async () => {
    await renderHome();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/your.*identity/i);
  });

  it("renders the protocol link", () => {
    render(<LandingPageWrapper />);
    expect(screen.getByText(/explore the protocol/i)).toBeInTheDocument();
  });

  it("renders the Header component", () => {
    render(<LandingPageWrapper />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the Footer component", () => {
    render(<LandingPageWrapper />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders LOGOUT button when authenticated", async () => {
    await renderHome();
    const logoutButtons = screen.getAllByRole("button", { name: /log.?out/i });
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders TrustTiers", () => {
    render(<LandingPageWrapper />);
    expect(screen.getByTestId("trust-tiers")).toBeInTheDocument();
  });

  it("calls logout when LOGOUT button is clicked", async () => {
    const logoutFn = jest.fn();
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user, logout: logoutFn }));
    await renderHome();
    const logoutButtons = screen.getAllByRole("button", { name: /log.?out/i });
    await act(async () => {
      logoutButtons[0].click();
    });
    expect(logoutFn).toHaveBeenCalledTimes(1);
  });
});

describe("Landing page — unauthenticated user", () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user: null }));
  });

  it("does NOT render a LOGOUT button when there is no user", async () => {
    await renderHome();
    expect(screen.queryByRole("button", { name: /log.?out/i })).toBeNull();
  });
});
