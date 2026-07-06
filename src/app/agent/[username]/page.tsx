"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Shield, Bot, Zap, Clock, ExternalLink } from "lucide-react";
import { PiBrowserGuard, PiBrowserBanner } from "@/components/PiBrowserGuard";
import { DevModeBanner } from "@/components/DevModeBanner";

interface AgentData {
  username: string;
  walletAddress: string | null;
  tier: string;
  xp: number;
  verified: boolean;
  did: string | null;
  agent: {
    name: string;
    status: string;
    lastActive: string | null;
  } | null;
  memberSince: string;
}

/**
 * Public agent subdomain page — username.axiomid.app
 * Displays minimal public profile. No auth required.
 */
export default function AgentPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/agent/public?username=${encodeURIComponent(username)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Agent not found");
        return res.json();
      })
      .then((data) => {
        setAgent(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Failed to load agent");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [username]);

  if (loading) {
    return (
      <PiBrowserGuard showSplash={false}>
        <PiBrowserBanner />
        <DevModeBanner />
        <main className="min-h-screen bg-grid flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="bento-card p-8">
              <div className="h-6 bg-white/5 rounded animate-pulse mb-4" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </main>
      </PiBrowserGuard>
    );
  }

  if (error || !agent) {
    return (
      <PiBrowserGuard showSplash={false}>
        <PiBrowserBanner />
        <DevModeBanner />
        <main className="min-h-screen bg-grid flex items-center justify-center">
          <div className="bento-card p-8 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-2">Agent Not Found</h1>
            <p className="text-sm text-zinc-400 mb-4">
              No agent found for <span className="font-mono text-axiom-purple">@{username}</span>
            </p>
            <Link href="/" className="text-xs font-mono text-axiom-purple hover:text-axiom-purple/80">
              ← Back to AxiomID
            </Link>
          </div>
        </main>
      </PiBrowserGuard>
    );
  }

  const memberSince = new Date(agent.memberSince);
  const daysActive = Math.max(1, Math.floor((Date.now() - memberSince.getTime()) / 86400000));

  return (
    <PiBrowserGuard showSplash={false}>
      <PiBrowserBanner />
      <DevModeBanner />
      <main className="min-h-screen bg-grid">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Profile header */}
          <div className="bento-card p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-axiom-purple/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-axiom-purple" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono">@{agent.username}</h1>
                <p className="text-xs text-zinc-400">
                  {agent.tier} · {agent.xp} XP
                  {agent.verified && (
                    <span className="ml-2 text-emerald-400">✓ Verified</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-neon-green" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Tier</span>
                </div>
                <span className="text-lg font-bold text-white font-mono">{agent.tier}</span>
              </div>
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Experience</span>
                </div>
                <span className="text-lg font-bold text-white font-mono">{agent.xp} XP</span>
              </div>
            </div>
          </div>

          {/* Agent status */}
          {agent.agent && (
            <div className="bento-card p-5 mb-6">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
                Autonomous Agent
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-white">{agent.agent.name}</span>
                  <span className={`ml-2 text-[10px] font-mono px-2 py-0.5 rounded ${
                    agent.agent.status === "ACTIVE"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-zinc-400 bg-zinc-400/10"
                  }`}>
                    {agent.agent.status}
                  </span>
                </div>
                {agent.agent.lastActive && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {new Date(agent.agent.lastActive).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bento-card p-5">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
              Links
            </h2>
            <div className="space-y-2">
              {agent.did && (
                <a
                  href={`/.well-known/did.json?did=${encodeURIComponent(agent.did)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-300">DID Document</span>
                </a>
              )}
              <Link
                href={`/passport/${agent.username}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-mono text-zinc-300">Full Passport</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-mono text-zinc-300">AxiomID Home</span>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] font-mono text-zinc-600 mt-8">
            {daysActive} days on AxiomID · {agent.tier} tier
          </p>
        </div>
      </main>
    </PiBrowserGuard>
  );
}
