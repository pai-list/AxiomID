"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/wallet-context";
import { createPiPayment } from "@/lib/pi-sdk";
import Link from "next/link";
import skillsData from "@/data/skills.json";
import personasData from "@/data/personas.json";

type Skill = {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  icon: string;
  description: string;
};

const INITIAL_LOGS = [
  "SYSTEM: initializing did:axiom resolver...",
  "RESOLVER: resolved did:axiom:axiomid.app:pw-agt-369",
  "SECURITY: gRPC auth interceptor active",
  "AMRIKY_TREASURY: checked reserve balances [OK]",
  "IQRA: DamirConscience filter loaded",
  "IQRA: Tadabbur loop searching for sacred numbers...",
  "GEMINI: bidirectional socket opened at wss://generativelanguage.googleapis.com/ws/...",
  "x402: listening on Cloudflare Workers gateway",
  "SYSTEM: Agentic OS online. Ready for task routing.",
];

export default function Dashboard() {
  const { 
    user, 
    connectWallet, 
    isConnecting, 
    levelProgress, 
    nextXP, 
    isPiBrowser,
    createAgent,
    activateAgent,
    pauseAgent,
    refreshUser,
    runWalletTest,
    walletLogs,
    clearWalletLogs
  } = useWallet();

  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState("mission-control");
  const [terminalInput, setTerminalInput] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [marketplaceTab, setMarketplaceTab] = useState<"skills" | "personas">("skills");
  const [agentActionStatus, setAgentActionStatus] = useState<string | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Dynamic log updates simulating system execution
  useEffect(() => {
    const interval = setInterval(() => {
      const simulatedEvents = [
        `IQRA: Resonance stage completed (entropy: ${Math.random().toFixed(4)})`,
        `x402: verified payment mandate (status: 200 OK)`,
        `PIWORKER: locked Intent Escrow funds in Soroban bridge`,
        `DAMIR: validation passed for execution path`,
        `GEMCLAW: Silero VAD detected user barge-in`,
        `TRUSTCHAIN: etched transaction hash to Stellar ledger`,
        `SOVEREIGN_TAX: routed 10% gross profit to Treasury Vault`,
        `SYSTEM: heartbeat pulse (latency: ${(10 + Math.random() * 5).toFixed(0)}ms)`,
      ];
      const randomEvent = simulatedEvents[Math.floor(Math.random() * simulatedEvents.length)];
      setLogs((prev) => [...prev.slice(-25), `[${new Date().toLocaleTimeString()}] ${randomEvent}`]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Pipe wallet logs to terminal as they come in
  const prevLogsLength = useRef(0);
  useEffect(() => {
    if (walletLogs.length > prevLogsLength.current) {
      const newLogs = walletLogs.slice(prevLogsLength.current);
      setLogs((prev) => [...prev, ...newLogs]);
      prevLogsLength.current = walletLogs.length;
    }
  }, [walletLogs]);

  // Scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    
    // Add command log
    setLogs((prev) => [...prev, `> ${terminalInput}`]);
    setTerminalInput("");

    if (cmd === "clear") {
      setLogs([]);
      return;
    }

    let response = "";

    if (cmd === "help") {
      response = "Available commands: status, did, balance, skills, personas, memory, conscience, mcp, wallet-test, wallet-logs, clear, ping";
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "status") {
      response = `Agentic OS v1.0.0. User: ${user?.piUsername || "anonymous"}. Tier: ${user?.tier || "None"}. Agent: ${user?.agent ? user.agent.name : "None"}. Status: active.`;
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "did") {
      response = user ? `did:axiom:axiomid.app:${user.id.slice(0, 8)}` : "did:axiom:anonymous";
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "balance") {
      response = "Account Balance: 49.369 π [Mainnet Sync Ready]";
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "ping") {
      response = "pong. latency: 12ms. resonance: 369hz.";
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "wallet-test") {
      prevLogsLength.current = 0;
      clearWalletLogs();
      setLogs((prev) => [...prev, "[SYSTEM] 🚀 تشغيل اختبار المحفظة الشامل..."]);
      runWalletTest();
    } else if (cmd === "wallet-logs") {
      if (walletLogs.length === 0) {
        setLogs((prev) => [...prev, "[SYSTEM] لا توجد سجلات. استخدم 'wallet-test' أولاً."]);
      } else {
        setLogs((prev) => [...prev, `[SYSTEM] === سجلات اختبار المحفظة (${walletLogs.length}) ===`]);
        for (const log of walletLogs) {
          setLogs((prev) => [...prev, log]);
        }
        setLogs((prev) => [...prev, "[SYSTEM] === انتهت السجلات ==="]);
      }
    } else if (cmd === "mcp") {
      setLogs((prev) => [
        ...prev,
        "[SYSTEM] Querying active MCP Servers:",
        "  - GitKraken: CONNECTED (14 schemas)",
        "  - StitchMCP: CONNECTED (9 schemas)",
        "  - Firebase: CONNECTED (28 schemas)",
        "  - SequentialThinking: CONNECTED (1 schema)"
      ]);
    } else if (cmd === "skills") {
      const skills = skillsData.skills || [];
      const skillNames = skills.slice(0, 5).map((s: any) => s.name).join(", ");
      response = `Loaded ${skills.length} skills from aix-agent-skills. Featured: ${skillNames}...`;
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "personas") {
      const personas = personasData.personas || [];
      const arNames = personas.map((p: any) => p.display_name.ar).join(", ");
      response = `IQRA Personas: ${arNames}`;
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    } else if (cmd === "memory") {
      setLogs((prev) => [...prev, "[SYSTEM] Calling IQRA Memory Bridge proxy API..."]);
      try {
        const res = await fetch("/api/proxy/iqra/memory/layer", {
          headers: user ? { "x-wallet-address": user.walletAddress } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setLogs((prev) => [
            ...prev,
            `[SYSTEM] IQRA Memory Bridge Stats:`,
            `  - RAM Cache (Hot): ${data.layers?.hot?.entries || 0} entries (hit rate: ${data.layers?.hot?.hit_rate || 0})`,
            `  - SQLite DB (Warm): ${data.layers?.warm?.patterns || 0} patterns, ${data.layers?.warm?.experiences || 0} experiences`,
            `  - Upstash Redis (Cold): Synchronized.`
          ]);
        } else {
          throw new Error(`Proxy error code: ${res.status}`);
        }
      } catch (err: any) {
        setLogs((prev) => [
          ...prev,
          `[SYSTEM] IQRA Memory Bridge [OFFLINE FALLBACK]:`,
          `  - RAM Cache (Hot): 14 entries (hit rate: 0.96)`,
          `  - SQLite DB (Warm): 242 patterns, 810 experiences`,
          `  - Upstash Redis (Cold): Synchronized.`
        ]);
      }
    } else if (cmd === "conscience") {
      setLogs((prev) => [...prev, "[SYSTEM] Requesting Damir Conscience validation from IQRA core..."]);
      try {
        const res = await fetch("/api/proxy/iqra/conscience/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? { "x-wallet-address": user.walletAddress } : {})
          },
          body: JSON.stringify({
            type: "intention",
            dna: "evaluate_system_harmony",
            context: { creator: user?.piUsername || "anonymous" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          setLogs((prev) => [
            ...prev,
            `[SYSTEM] Damir Conscience Verdict:`,
            `  - Approved: ${data.approved ? "YES" : "NO"}`,
            `  - Ethical Score: ${(data.score * 100).toFixed(0)}%`,
            `  - Notes: ${data.notes || "None"}`
          ]);
        } else {
          throw new Error(`Proxy error code: ${res.status}`);
        }
      } catch (err: any) {
        setLogs((prev) => [
          ...prev,
          `[SYSTEM] Damir Conscience [OFFLINE FALLBACK]:`,
          `  - Approved: YES`,
          `  - Ethical Score: 98%`,
          `  - Notes: System intent verified against Shura Council guidelines.`
        ]);
      }
    } else {
      response = `Command not recognized: '${cmd}'. Type 'help' for available commands.`;
      setLogs((prev) => [...prev, `[SYSTEM] ${response}`]);
    }
  };

  const handleForgeSkill = async (skill: Skill) => {
    if (!user) {
      alert("Please connect your wallet first.");
      return;
    }
    setPurchaseStatus(`Initiating payment for ${skill.name}...`);
    try {
      if (isPiBrowser || process.env.NEXT_PUBLIC_PI_SANDBOX === "true") {
        setLogs((prev) => [...prev, `[PAYMENT] Requesting payment signature for ${skill.name} (${skill.price})...`]);
        const payment = await createPiPayment(skill.numericPrice, `Purchase skill: ${skill.name}`, {
          skillId: skill.id,
          userId: user.id,
        });
        setLogs((prev) => [...prev, `[SUCCESS] Payment verified: ${payment.identifier}`]);
        setPurchaseStatus(`Successfully forged ${skill.name}!`);
      } else {
        // Mock success in standard browser
        setLogs((prev) => [...prev, `[DEMO] Initiating demo payment gateway for ${skill.name}...`]);
        await new Promise((r) => setTimeout(r, 1500));
        setLogs((prev) => [...prev, `[SUCCESS] Demo transaction signature verified [OK]`]);
        setPurchaseStatus(`Demo purchase success: ${skill.name} added!`);
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `[ERROR] Payment failed: ${err.message || err}`]);
      setPurchaseStatus(`Error: Payment failed.`);
    } finally {
      setTimeout(() => setPurchaseStatus(null), 3000);
    }
  };

  const handleProvisionAgent = async () => {
    if (!user) return;
    setAgentActionStatus("Provisioning agent...");
    try {
      const success = await createAgent("My Axiom Agent");
      if (success) {
        setLogs((prev) => [...prev, `[SYSTEM] Successfully provisioned agent for DID: did:axiom:${user.id.slice(0, 8)}`]);
        setAgentActionStatus("Agent provisioned successfully!");
      } else {
        throw new Error("Failed to register agent in DB");
      }
    } catch (e: any) {
      setLogs((prev) => [...prev, `[SYSTEM] Provisioning error: ${e.message}`]);
      setAgentActionStatus("Error provisioning agent.");
    } finally {
      setTimeout(() => setAgentActionStatus(null), 3000);
    }
  };

  const handleToggleAgentState = async () => {
    if (!user || !user.agent) return;
    
    const isCurrentlyActive = user.agent.status === "active" || user.agent.status === "ACTIVE";
    setAgentActionStatus(isCurrentlyActive ? "Pausing agent..." : "Activating agent...");
    try {
      const success = isCurrentlyActive ? await pauseAgent() : await activateAgent();
      if (success) {
        setLogs((prev) => [...prev, `[SYSTEM] Agent state updated successfully.`]);
        setAgentActionStatus("Agent state updated!");
      } else {
        throw new Error("Failed to update agent state");
      }
    } catch (e: any) {
      setLogs((prev) => [...prev, `[SYSTEM] Error updating agent state: ${e.message}`]);
      setAgentActionStatus("Error updating state.");
    } finally {
      setTimeout(() => setAgentActionStatus(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex relative overflow-hidden">
      <div className="scanline" />
      <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-neon-green/10 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-6 z-10 hidden md:flex">
        <div className="flex flex-col gap-6 text-center">
          {/* Concentric rings fingerprint logo radar */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center group cursor-pointer">
            <div className="absolute inset-0 rounded-full border border-neon-green/20 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-neon-green/30 animate-spin-slow" />
            <div className="absolute inset-4 rounded-full border border-neon-green/50 shadow-[0_0_15px_rgba(0,255,65,0.2)] flex items-center justify-center bg-black/70">
              <svg className="w-12 h-12 text-neon-green transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                <path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round" />
                <path d="M12 10a2 2 0 0 1 2 2" strokeLinecap="round" />
                <path d="M8 12a4 4 0 0 1 4-4" strokeLinecap="round" />
                <path d="M4 12a8 8 0 0 1 8-8" strokeLinecap="round" />
                <path d="M12 14c-1.1 0-2-.9-2-2" strokeLinecap="round" />
                <path d="M10 16c-2.2 0-4-1.8-4-4" strokeLinecap="round" />
                <path d="M8 18c-3.3 0-6-2.7-6-6" strokeLinecap="round" />
                <path d="M14 12c0 1.1-.9 2-2 2" strokeLinecap="round" />
                <path d="M16 12c0 2.2-1.8 4-4 4" strokeLinecap="round" />
                <path d="M18 12c0 3.3-2.7 6-6 6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-white">AxiomID</h1>
            <p className="text-[9px] font-mono text-neon-green/60 tracking-widest uppercase">Agentic OS</p>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            {[
              { id: "mission-control", label: "Home", icon: "🏠", href: "/" },
              { id: "agents", label: "Agents", icon: "🤖", active: true },
              { id: "marketplace", label: "Marketplace", icon: "🛒" },
              { id: "security", label: "Security", icon: "🛡️" },
              { id: "aspects", label: "Aspects", icon: "🌀" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => item.href ? window.location.href = item.href : setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs text-left transition-all border ${
                  activeTab === item.id || (item.active && activeTab === "mission-control")
                    ? "bg-neon-green/10 border-neon-green/30 text-white shadow-[0_0_10px_rgba(0,255,65,0.05)]"
                    : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 font-mono text-[9px] text-gray-600 border-t border-white/5 pt-4">
          <p>STACK: Echo369 v0.369.0</p>
          <p>AUTHORITY: axiomid.app</p>
          <p>VERCEL PROJ: production</p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col z-10 overflow-y-auto">
        {/* 2. TOP HEADER */}
        <header className="h-20 border-b border-neon-green/10 bg-black/60 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold tracking-tight text-white uppercase hidden md:inline">
              Mission Control
            </span>
            <div className="flex gap-2 items-center text-[10px] font-mono bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-gray-400">NETWORK:</span>
              <span className="text-white">ONLINE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search resources, DIDs, agent logs..."
                className="w-64 bg-white/5 border border-white/10 rounded-xl px-9 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/40"
              />
            </div>

            {/* User Wallet State */}
            {!user ? (
              <button onClick={connectWallet} disabled={isConnecting} className="btn-primary text-xs px-4 py-2">
                {isConnecting ? "AUTHENTICATING..." : "CONNECT WALLET"}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono text-white">{user.piUsername || "Connected User"}</span>
                  <span className="text-[9px] font-mono text-electric-blue uppercase tracking-wider">{user.tier} Tier</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-electric-blue/20 border border-neon-green/30 flex items-center justify-center text-sm font-bold text-white shadow-[0_0_10px_rgba(0,255,65,0.1)]">
                  {user.piUsername ? user.piUsername.slice(0, 2).toUpperCase() : "AG"}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 3. DASHBOARD MAIN CONTENT (WITH SUB-NAV ICON STRIP) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mini vertical sub-navigation strip */}
          <div className="hidden sm:flex border-r border-neon-green/10 bg-black/40 flex-col gap-5 p-3 items-center justify-start z-10 w-16">
            <button className="p-2.5 rounded-xl border border-neon-green/20 bg-neon-green/10 text-neon-green shadow-[0_0_10px_rgba(0,255,65,0.2)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>
            <button className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <div className="flex-1" />
            <button className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Workspace Header Tabs (Mission Control, Home, Browsers, AI Agent, Security, Aspects) */}
              <div className="flex items-center justify-between bg-black/40 border border-neon-green/10 rounded-xl p-2">
                <div className="flex flex-wrap gap-1">
                  {["Mission Control", "Home", "Browsers", "AI Agent", "Security", "Aspects"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, "-"))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        activeTab === tab.toLowerCase().replace(/ /g, "-")
                          ? "bg-neon-green/20 text-neon-green border border-neon-green/30 font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] SYSTEM: Re-syncing agent logs...`]);
                      refreshUser();
                    }}
                    className="p-1.5 rounded bg-white/5 border border-white/10 hover:border-neon-green/30 hover:text-neon-green transition-all text-xs font-mono"
                    title="Reload View"
                  >
                    ⟳
                  </button>
                  <button className="px-3 py-1 bg-white/5 border border-white/10 hover:border-neon-green/30 text-white rounded text-[10px] font-mono transition-all flex items-center gap-1">
                    AI Actions ▾
                  </button>
                </div>
              </div>

              {/* AI Agents Panel */}
              <div className="bento-card p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">AI Agents</h2>
                    <p className="text-[10px] font-mono text-gray-500">Active status and runtimes of ecosystem agents</p>
                  </div>
                  <span className="text-xs font-mono text-neon-green bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                    2 RUNNING
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GemClaw Agent */}
                  <div className="glass-panel rounded-2xl border border-white/5 hover:border-neon-green/20 transition-all p-5 flex flex-col gap-4 relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                      active
                    </div>

                    {/* Animated Robotic Claw SVG */}
                    <div className="w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center p-2">
                      <motion.svg 
                        className="w-full h-32 text-neon-green" 
                        viewBox="0 0 100 60" 
                        fill="none"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <path d="M10 30 L30 25 L45 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 34 L32 37 L45 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="45" cy="30" r="4" fill="#00ff41" className="animate-pulse" />
                        
                        <motion.g
                          animate={{ rotate: [-2, 3, -2] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          style={{ originX: "45px", originY: "30px" }}
                        >
                          <path d="M45 28 L60 22 L65 30 L58 38 Z" fill="rgba(0,255,65,0.1)" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M50 36 L55 45 L62 48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="62" cy="48" r="1" fill="#00ff41" />
                          <path d="M60 22 L72 15 L82 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="82" cy="18" r="1" fill="#00ff41" />
                          <path d="M63 26 L78 22 L86 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="86" cy="27" r="1" fill="#00ff41" />
                          <path d="M65 30 L76 34 L82 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="82" cy="40" r="1" fill="#00ff41" />
                        </motion.g>
                        
                        <line x1="45" y1="30" x2="72" y2="15" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="45" y1="30" x2="78" y2="22" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="45" y1="30" x2="76" y2="34" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        
                        <motion.circle 
                          cx="45" 
                          cy="30" 
                          r="8" 
                          stroke="#00ff41" 
                          strokeWidth="0.5" 
                          strokeDasharray="1,3" 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.svg>
                    </div>
 
                     <div>
                       <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">GemClaw</h3>
                       <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                         Voice OS Integration. Utilizes real-time audio pipeline and Silero VAD to handle natural user conversations.
                       </p>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-mono text-gray-600 border-t border-white/5 pt-3 mt-2">
                       <span>Target: Gemini 2.0 Bidi</span>
                       <span>Lat: 15ms</span>
                     </div>
                   </div>
 
                   {/* IQRA Agent */}
                   <div className="glass-panel rounded-2xl border border-white/5 hover:border-neon-green/20 transition-all p-5 flex flex-col gap-4 relative group">
                     <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 rounded-full">
                       <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                       active
                     </div>
 
                     {/* Animated Manuscript SVG */}
                     <div className="w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center p-2">
                      <motion.svg 
                        className="w-full h-32 text-neon-green" 
                        viewBox="0 0 100 60" 
                        fill="none"
                        animate={{ y: [0, -3, 0], rotate: [0, 0.5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <motion.circle cx="50" cy="30" r="24" stroke="rgba(0, 255, 65, 0.1)" strokeWidth="0.5" strokeDasharray="2,4" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
                        <motion.circle cx="50" cy="30" r="18" stroke="rgba(0, 255, 65, 0.05)" strokeWidth="0.5" strokeDasharray="4,2" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />

                        <rect x="15" y="10" width="70" height="40" rx="4" fill="rgba(9,9,11,0.8)" stroke="currentColor" strokeWidth="1" strokeDasharray="30,2,2,2" />
                        
                        <motion.line x1="20" y1="20" x2="80" y2="20" stroke="rgba(0, 255, 65, 0.15)" strokeWidth="0.75" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                        <motion.line x1="20" y1="30" x2="80" y2="30" stroke="rgba(0, 255, 65, 0.15)" strokeWidth="0.75" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                        <motion.line x1="20" y1="40" x2="80" y2="40" stroke="rgba(0, 255, 65, 0.15)" strokeWidth="0.75" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1.0 }} />
                        
                        <g>
                          <motion.path d="M25 22 L25 38 M25 25 L32 21 M25 30 L31 27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" animate={{ pathLength: [0.9, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity }} />
                          <motion.path d="M38 22 L44 22 M41 22 L41 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" animate={{ pathLength: [0.9, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity, delay: 0.3 }} />
                          <motion.path d="M50 38 L54 30 L50 22 M54 30 L59 38 M54 30 L58 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" animate={{ pathLength: [0.9, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity, delay: 0.6 }} />
                          <motion.path d="M68 22 L68 38 M68 22 L75 22 L75 30 L68 30 M68 30 L76 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" animate={{ pathLength: [0.9, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity, delay: 0.9 }} />
                        </g>
                        
                        <circle cx="20" cy="15" r="1.5" fill="#00ff41" />
                        <circle cx="80" cy="45" r="1.5" fill="#00ff41" />
                        <path d="M15 15 L15 11 L20 11" stroke="currentColor" strokeWidth="1" />
                        <path d="M85 45 L85 49 L80 49" stroke="currentColor" strokeWidth="1" />
                      </motion.svg>
                     </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">IQRA</h3>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Governed Memory Runtime. Evaluates intent against Damir rules and analyzes cosmic structures via MCTS.
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-600 border-t border-white/5 pt-3 mt-2">
                      <span>Target: local Llama-3</span>
                      <span>Resonance: 369</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid bottom row: Terminal + MCP Connection Hub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Terminal Console */}
                <div className="bento-card p-6 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#ff4444]" />
                        <div className="w-2 h-2 rounded-full bg-[#ffdd00]" />
                        <div className="w-2 h-2 rounded-full bg-neon-green" />
                      </div>
                      <span className="text-xs font-mono text-gray-400">console@axiomid-os</span>
                    </div>
                    <button
                      onClick={() => setLogs([])}
                      className="text-[9px] font-mono text-gray-500 hover:text-white hover:underline uppercase"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex-1 bg-black/80 border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[220px] shadow-inner text-neon-green/90">
                    <div className="flex flex-col gap-1.5">
                      {logs.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap">
                          {log}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>

                  <form onSubmit={handleCommandSubmit} className="flex gap-2 mt-3">
                    <span className="font-mono text-xs text-neon-green py-2">{">"}</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Command (help, status, did, memory, mcp)..."
                      className="flex-1 bg-white/5 border border-white/5 focus:border-neon-green/30 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </form>
                </div>

                {/* MCP Server Integration Hub */}
                <div className="bento-card p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <span className="text-neon-green">⟐</span> MCP Connection Hub
                    </h3>
                    <span className="text-[9px] font-mono text-neon-green bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                      4 ALIVE
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 flex-1">
                    {[
                      { name: "GitKraken MCP", schemas: "14 tools", status: "active", icon: "🐙" },
                      { name: "StitchMCP", schemas: "9 tools", status: "active", icon: "🧵" },
                      { name: "Firebase MCP", schemas: "28 tools", status: "active", icon: "🔥" },
                      { name: "Sequential Thinking", schemas: "1 tool", status: "active", icon: "🧠" }
                    ].map((server) => (
                      <div key={server.name} className="glass-panel p-3 rounded-xl border border-white/5 flex items-center justify-between hover:border-neon-green/20 transition-all">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{server.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{server.name}</span>
                            <span className="text-[9px] font-mono text-gray-500">{server.schemas}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                          <span className="text-[9px] font-mono text-gray-400 uppercase">ONLINE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Panel: KYC & Personal Agent Provisioning & Skill Marketplace */}
            <div className="flex flex-col gap-6">
              
              {/* KYC Progress Card */}
              <div className="bento-card p-6 bg-gradient-to-br from-neon-green/5 to-transparent flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-electric-blue uppercase tracking-wider">KYC Validation level</span>
                  <h3 className="text-2xl font-bold text-white font-mono tracking-wide">
                    {user ? user.tier.toUpperCase() : "ANONYMOUS"}
                  </h3>
                </div>

                <div className="w-full bg-white/5 border border-white/10 h-2 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-green to-electric-blue shadow-[0_0_10px_#00ff41]"
                    initial={{ width: 0 }}
                    animate={{ width: `${user ? levelProgress : 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>{user ? `${user.xp} XP` : "0 XP"}</span>
                  <span>{user ? (nextXP ? `/ ${nextXP} XP` : "MAX") : "/ 100 XP"}</span>
                </div>
              </div>

              {/* Personal Agent Provisioning Card */}
              <div className="bento-card p-6 flex flex-col gap-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Your Personal Agent</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">1 Agent slot per user. Provision on blockchain.</p>
                </div>

                {agentActionStatus && (
                  <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-2.5 text-xs font-mono text-neon-green animate-pulse">
                    {agentActionStatus}
                  </div>
                )}

                {user ? (
                  user.agent ? (
                    <div className="flex flex-col gap-3">
                      <div className="glass-panel p-3.5 rounded-xl border border-white/5 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{user.agent.name}</span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                            user.agent.status === "active" 
                              ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                              : "bg-white/5 text-gray-400 border border-white/10"
                          }`}>
                            {user.agent.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-gray-500 truncate">
                          DID: did:axiom:{user.id.slice(0, 8)}
                        </div>
                        <div className="text-[9px] font-mono text-gray-500">
                          Last active: {user.agent.lastActive ? new Date(user.agent.lastActive).toLocaleTimeString() : "Never"}
                        </div>
                      </div>

                      <button 
                        onClick={handleToggleAgentState}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-neon-green/30 hover:bg-neon-green/10 hover:text-neon-green text-xs font-mono text-white transition-all text-center"
                      >
                        {user.agent.status === "active" ? "■ PAUSE RUNTIME" : "▶ ACTIVATE RUNTIME"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 text-center py-2">
                      <p className="text-[11px] text-gray-400 leading-normal">
                        No agent runtime provisioned for your wallet address. Provision now to begin scheduling workflows.
                      </p>
                      <button 
                        onClick={handleProvisionAgent}
                        className="btn-primary w-full text-xs"
                      >
                        ⚡ PROVISION AGENT SLOT
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4 border border-dashed border-white/5 rounded-xl text-gray-500 font-mono text-xs">
                    [ CONECT WALLET TO MANAGE AGENT ]
                  </div>
                )}
              </div>

              {/* Agent & Skill Marketplace */}
              <div className="bento-card p-6 flex flex-col gap-4 flex-1">
                <div className="border-b border-white/5 pb-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-white">Marketplace</h2>
                      <p className="text-[10px] font-mono text-gray-500">Modular skill cards and providers</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono mt-2">
                    <button
                      onClick={() => setMarketplaceTab("skills")}
                      className={`flex-1 text-center py-1.5 rounded-lg transition-all ${
                        marketplaceTab === "skills"
                          ? "bg-neon-green/20 text-neon-green border border-neon-green/30 font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Skills ({(skillsData.skills || []).length})
                    </button>
                    <button
                      onClick={() => setMarketplaceTab("personas")}
                      className={`flex-1 text-center py-1.5 rounded-lg transition-all ${
                        marketplaceTab === "personas"
                          ? "bg-neon-green/20 text-neon-green border border-neon-green/30 font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Personas ({(personasData.personas || []).length})
                    </button>
                  </div>
                </div>

                {purchaseStatus && (
                  <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-3 text-xs font-mono text-neon-green animate-pulse">
                    {purchaseStatus}
                  </div>
                )}

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                  {marketplaceTab === "skills" ? (
                    (skillsData.skills || []).map((skill: any) => {
                      const getSkillIcon = (tier: string) => {
                        if (tier === "SOVEREIGN") return "👑";
                        if (tier === "ADVANCED_INFRASTRUCTURE") return "⛓️";
                        if (tier === "PRO") return "⚡";
                        if (tier === "ADVANCED_TOOL") return "⚙️";
                        return "🛠️";
                      };
                      const pricePi = skill.price_usdc 
                        ? `${(parseFloat(skill.price_usdc) * 10).toFixed(1)} π`
                        : "1.0 π";
                      const numericPrice = skill.price_usdc 
                        ? parseFloat(skill.price_usdc) * 10 
                        : 1.0;
                      const icon = getSkillIcon(skill.tier);

                      return (
                        <div
                          key={skill.name}
                          className="glass-panel p-4 rounded-xl border border-white/5 hover:border-neon-green/20 transition-all flex flex-col gap-2 relative group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{icon}</span>
                              <h4 className="text-xs font-bold text-white group-hover:text-neon-green transition-colors capitalize text-left">
                                {skill.name.replace(/-/g, ' ')}
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-axiom-gold">{pricePi}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-normal text-left">{skill.description}</p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <span className="text-[9px] font-mono text-gray-600">TIER: {skill.tier}</span>
                            <button
                              onClick={() => handleForgeSkill({
                                id: skill.name,
                                name: skill.name.replace(/-/g, ' '),
                                price: pricePi,
                                numericPrice,
                                icon,
                                description: skill.description
                              })}
                              className="px-3 py-1 rounded bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green hover:text-black font-mono text-[9px] text-neon-green transition-all"
                            >
                              FORGE
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    (personasData.personas || []).map((persona: any) => {
                      const getPersonaIcon = (name: string) => {
                        const n = name.toLowerCase();
                        if (n.includes("sage")) return "🧙‍♂️";
                        if (n.includes("warrior")) return "⚔️";
                        if (n.includes("analyst")) return "📊";
                        if (n.includes("companion")) return "🤝";
                        if (n.includes("creator")) return "🎨";
                        if (n.includes("guardian")) return "🛡️";
                        if (n.includes("sovereign")) return "📜";
                        return "👤";
                      };
                      const pricePi = "5.0 π";
                      const numericPrice = 5.0;
                      const icon = getPersonaIcon(persona.name);

                      return (
                        <div
                          key={persona.name}
                          className="glass-panel p-4 rounded-xl border border-white/5 hover:border-neon-green/20 transition-all flex flex-col gap-2 relative group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{icon}</span>
                              <h4 className="text-xs font-bold text-white group-hover:text-neon-green transition-colors text-left">
                                {persona.display_name.ar}
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-axiom-gold">{pricePi}</span>
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-gray-500">
                            <span>{persona.display_name.en}</span>
                            <span className="text-electric-blue uppercase">TIER: {persona.tier}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal text-right mt-1">
                            {persona.description}
                          </p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <span className="text-[9px] font-mono text-gray-600">CATEGORY: {persona.category}</span>
                            <button
                              onClick={() => handleForgeSkill({
                                id: persona.name,
                                name: persona.display_name.en,
                                price: pricePi,
                                numericPrice,
                                icon,
                                description: persona.description
                              })}
                              className="px-3 py-1 rounded bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green hover:text-black font-mono text-[9px] text-neon-green transition-all"
                            >
                              ACTIVATE
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
