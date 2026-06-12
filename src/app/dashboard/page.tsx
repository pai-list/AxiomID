"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "../context/wallet-context";
import skillsData from "@/data/skills.json";

const INITIAL_LOGS = [
  "SYSTEM: initializing did:axiom resolver...",
  "RESOLVER: resolved did:axiom:axiomid.app:pw-agt-369",
  "SECURITY: gRPC auth interceptor active",
  "SYSTEM: Agentic OS online. Ready for task routing.",
];

export default function Dashboard() {
  const {
    user,
    isLoading,
    connectWallet,
    isConnecting,
    levelProgress,
  } = useWallet();

  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, "SYSTEM: Wallet connection check completed."]);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-grid">
      <div className="scanline" />

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-electric-blue/20 flex items-center justify-center">
              <span className="text-neon-green font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AxiomID Dashboard</h1>
              <p className="text-xs text-gray-400 font-mono">Agent Identity Layer v1.0.0</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="bento-card p-8">
              <div className="h-8 bg-white/5 rounded animate-pulse mb-4" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bento-card p-6">
                  <div className="h-6 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-8 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            <div className="bento-card p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {user.piUsername}</h2>
              <p className="text-gray-400">Your agent identity is ready. Level {user.tier} • {user.xp} XP</p>
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-green to-electric-blue transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bento-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Agent Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Level</span>
                    <span className="text-neon-green font-mono">{user.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">XP</span>
                    <span className="text-electric-blue font-mono">{user.xp}</span>
                  </div>
                </div>
              </div>

              <div className="bento-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skillsData.skills.slice(0, 3).map((skill: { name: string; description: string }) => (
                    <span key={skill.name} className="px-3 py-1 rounded-full bg-axiom-purple/20 text-axiom-purple text-xs font-mono">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-electric-blue/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to AxiomID</h2>
              <p className="text-gray-400 mb-8">Connect your wallet to access your agent identity, perform actions, and manage your digital passport.</p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-green/20 to-electric-blue/20 border border-neon-green/30 text-neon-green font-medium hover:from-neon-green/30 hover:to-electric-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center gap-8">
            {[
              { id: "passport", icon: "🆔", label: "Passport", href: user ? `/passport/${user.piUsername || user.walletAddress}` : undefined },
              { id: "actions", icon: "⚡", label: "Actions", href: "/" },
              { id: "terminal", icon: "💻", label: "Terminal", disabled: true },
              { id: "marketplace", icon: "🛒", label: "Marketplace", disabled: true },
            ].map((tab) => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => { if (tab.href) window.location.href = tab.href; }}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
                  tab.disabled
                    ? "text-gray-700 cursor-not-allowed"
                    : tab.id === "passport"
                      ? "bg-neon-green/20 text-neon-green"
                      : "text-gray-500 hover:text-white"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs font-mono">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
