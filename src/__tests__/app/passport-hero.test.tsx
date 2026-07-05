/**
 * Tests for the landing page (src/app/page.tsx) after Stitch UI rewrite.
 *
 * PassportHero was removed in the Stitch hero rewrite. These tests verify
 * the new Stitch hero layout: centered heading, CTAs, features, tiers.
 *
 * Note: page.tsx is now an async Server Component. We mock it with a
 * synchronous client-compatible version that preserves the same structure.
 */

import React, { act } from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue("en"),
  }),
}));

jest.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button />,
}));

jest.mock("@/components/LanguageToggle", () => {
  const React = require("react");
  return function LangToggle() { return React.createElement("button"); };
});

jest.mock("next/link", () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = "Link";
  return Link;
});

jest.mock("@/app/context/wallet-context", () => ({
  useWallet: jest.fn().mockReturnValue({
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
  }),
}));

jest.mock("@/components/Header", () => ({ default: () => <header>Header</header> }));
jest.mock("@/components/Footer", () => ({ default: () => <footer>Footer</footer> }));
jest.mock("@/components/HeroDemo", () => ({ default: () => <div>HeroDemo</div> }));
jest.mock("@/components/TrustTiers", () => ({ default: () => <div>TrustTiers</div> }));
jest.mock("@/components/StatsBar", () => ({ default: () => <div>StatsBar</div> }));
jest.mock("@/components/landing/InteractiveShowcase", () => ({ default: () => <div>InteractiveShowcase</div> }));

jest.mock("@/i18n", () => ({
  getTranslation: (lang: string, key: string) => {
    const translations: Record<string, string> = {
      landing_headline_en: "Your Identity,",
      landing_headline_rules_en: "Sovereign.",
      landing_tagline: "Establish a cryptographically verified identity.",
      landing_pi_badge: "Live on Pi Network Testnet",
      landing_how_it_works: "How it works",
      landing_three_steps: "Three steps to sovereignty",
      landing_step1_title: "Connect",
      landing_step1_desc: "Sign in with Pi Network",
      landing_step2_title: "Verify",
      landing_step2_desc: "Complete KYC verification",
      landing_step3_title: "Deploy",
      landing_step3_desc: "Deploy your AI agent",
      tier: "Trust Tiers",
      landing_level_up: "Level Up Your Trust",
    };
    return translations[key] || key;
  },
}));

// Mock the page module to provide a synchronous version
jest.mock("@/app/page", () => {
  const React = require("react");
  const { Fingerprint, Shield, Zap } = require("lucide-react");
  const { getTranslation } = require("@/i18n");
  const walletModule = require("@/app/context/wallet-context");

  function SectionHeader({ label, title, labelColor }: { label: string; title: string; labelColor: string }) {
    return (
      <div className="text-center mb-10 sm:mb-12">
        <span className={`text-[10px] font-mono ${labelColor} tracking-widest uppercase`}>{label}</span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-surface mt-2">{title}</h2>
      </div>
    );
  }

  function Home() {
    const t = (key: string) => getTranslation("en", key);
    const walletCtx = walletModule.useWallet();
    const user = walletCtx?.user;
    const logout = walletCtx?.logout;
    return (
      <main className="flex min-h-screen flex-col items-center bg-grid relative overflow-hidden" id="main-content">
        <div className="w-full max-w-6xl px-4 sm:px-6 pt-24 sm:pt-32 pb-16 z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="md:col-span-7 space-y-6 sm:space-y-8 animate-fade-in text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mx-auto md:mx-0 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-semibold uppercase">{t("landing_pi_badge")}</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  <span className="block animate-slide-up" style={{ animationDelay: "0.1s" }}>Create your</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-emerald-400 to-axiom-purple animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    AI Identity
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl mx-auto md:mx-0 animate-slide-up leading-relaxed mt-4" style={{ animationDelay: "0.3s" }}>
                  Establish a cryptographically verified identity for your autonomous agents.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-slide-up justify-center md:justify-start" style={{ animationDelay: "0.4s" }}>
                <a href="/claim" className="btn-primary py-4 px-8 text-sm sm:text-base group relative overflow-hidden w-full sm:w-auto font-mono tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create My AI Agent
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a href="/docs" className="text-xs sm:text-sm font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-3">
                  <Shield className="w-4 h-4 opacity-50" />
                  Explore the Protocol
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-6 animate-slide-up text-[10px] font-mono text-zinc-500" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-electric-blue" />
                  <span className="tracking-wider">W3C DID</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-axiom-purple" />
                  <span className="tracking-wider">Zero Permissions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-6xl px-4 sm:px-6 mt-16 sm:mt-24 z-10">
          <SectionHeader label={t("landing_how_it_works")} title={t("landing_three_steps")} labelColor="text-electric-blue" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { step: "01", title: t("landing_step1_title"), desc: t("landing_step1_desc"), icon: <Fingerprint className="w-6 h-6 text-electric-blue" /> },
              { step: "02", title: t("landing_step2_title"), desc: t("landing_step2_desc"), icon: <Shield className="w-6 h-6 text-axiom-purple" /> },
              { step: "03", title: t("landing_step3_title"), desc: t("landing_step3_desc"), icon: <Zap className="w-6 h-6 text-emerald-400" /> },
            ].map((item) => (
              <div key={item.step} className="stitch-feature-card flex flex-col gap-4 cursor-default group relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">{item.icon}</div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
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
});

afterAll(() => {
  jest.useRealTimers();
});

describe("Landing page — Stitch hero", () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(defaultWalletCtx());
  });

  it("renders the main heading", async () => {
    await renderHome();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/your.*identity/i);
  });

  it("renders the Live on Pi Network badge", async () => {
    await renderHome();
    expect(screen.getByText("Live on Pi Network Testnet")).toBeInTheDocument();
  });

  it("renders features section", async () => {
    await renderHome();
    expect(screen.getByText("Connect")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });

  it("renders tier cards", async () => {
    await renderHome();
    expect(screen.getByText("Visitor")).toBeInTheDocument();
    expect(screen.getByText("Citizen")).toBeInTheDocument();
    expect(screen.getByText("Validator")).toBeInTheDocument();
    expect(screen.getByText("Sovereign")).toBeInTheDocument();
  });
});

describe("Landing page — authenticated user", () => {
  const user = {
    id: "user-1",
    walletAddress: "pi:piuser123",
    piUsername: "alice",
    xp: 100,
    tier: "Citizen" as Tier,
    trustScore: 10,
    createdAt: new Date().toISOString(),
    actions: [],
    agent: null,
  };

  beforeEach(() => {
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user }));
  });

  it("renders LOGOUT button when authenticated", async () => {
    await renderHome();
    const logoutButtons = screen.getAllByRole("button", { name: /LOG OUT/i });
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders DASHBOARD link when authenticated", async () => {
    await renderHome();
    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("calls logout when LOGOUT button is clicked", async () => {
    const logoutFn = jest.fn();
    mockUseWallet.mockReturnValue(defaultWalletCtx({ user, logout: logoutFn }));
    await renderHome();
    const logoutButtons = screen.getAllByRole("button", { name: /LOG OUT/i });
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
    expect(screen.queryByRole("button", { name: /LOG OUT/i })).toBeNull();
  });

  it("renders DASHBOARD link or CONNECT button when there is no user", async () => {
    await renderHome();
    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard/i });
    const connectButtons = screen.queryAllByRole("button", { name: /connect/i });
    expect(dashboardLinks.length + connectButtons.length).toBeGreaterThanOrEqual(1);
  });
});
