"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useWallet } from "./context/wallet-context";
import Link from "next/link";
import { ACTIONS } from "@/lib/actions";
import { playClickSound, playSuccessSound } from "@/lib/sound";

/* ============================================
   ICONS
   ============================================ */
const Icons = {
  Twitter: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Discord: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>,
  DiscordLogo: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>,
  Check: () => <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Lock: () => <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Wallet: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Activity: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
};

/* ============================================
   AXI MASCOT COMPONENT (Simplified)
   ============================================ */
function AxiMascot({ mood = "happy" }: { mood?: "happy" | "curious" | "excited" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const eyeColor = mood === "excited" ? "#00d4ff" : "#00ff41";

  // Periodic Blinking Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Mouse Tracking for Eyes
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2); // Normalized between -1 and 1
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2); // Normalized between -1 and 1
    // Cap displacement at 8px
    setMousePos({ x: x * 8, y: y * 8 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative w-32 h-32 md:w-40 md:h-40 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Dynamic Aura Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neon-green/10 to-electric-blue/10 blur-3xl rounded-full scale-110 opacity-70 group-hover:scale-125 transition-transform duration-500" />
      
      {/* Outer Rotating Energy Ring */}
      <motion.div 
        className="absolute inset-0 border border-dashed border-neon-green/20 rounded-full pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner Counter-Rotating Ring */}
      <motion.div 
        className="absolute inset-2 border border-dotted border-electric-blue/20 rounded-full pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* SVG Character */}
      <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,255,65,0.35)]">
        <defs>
          <linearGradient id="axiBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff41" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
          <radialGradient id="axiBodyFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#082517" />
            <stop offset="100%" stopColor="#020805" />
          </radialGradient>
        </defs>

        {/* Antenna / Star Symbol */}
        <motion.g
          animate={isHovered ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <line x1="100" y1="37" x2="100" y2="15" stroke="url(#axiBodyGrad)" strokeWidth="3" />
          <polygon points="100,5 104,13 112,13 106,19 108,27 100,22 92,27 94,19 88,13 96,13" fill="#00ff41" className="animate-pulse" />
        </motion.g>

        {/* Body Shell */}
        <ellipse cx="100" cy="115" rx="65" ry="68" fill="url(#axiBodyFill)" stroke="url(#axiBodyGrad)" strokeWidth="2.5" />

        {/* Antenna ears */}
        <path d="M48 80 Q35 70, 38 55" fill="none" stroke="url(#axiBodyGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M152 80 Q165 70, 162 55" fill="none" stroke="url(#axiBodyGrad)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Eyes (Blinking Logic) */}
        {isBlinking ? (
          // Eyelids closed
          <g stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" opacity="0.9">
            <line x1="68" y1="105" x2="88" y2="105" />
            <line x1="112" y1="105" x2="132" y2="105" />
          </g>
        ) : (
          // Eyelids open with pupil movement
          <g>
            {/* Eye Sockets */}
            <ellipse cx="78" cy="105" rx="14" ry="15" fill="#020805" stroke={eyeColor} strokeWidth="0.5" opacity="0.6" />
            <ellipse cx="122" cy="105" rx="14" ry="15" fill="#020805" stroke={eyeColor} strokeWidth="0.5" opacity="0.6" />

            {/* Pupils with mouse tracking */}
            <motion.g
              animate={{
                x: mousePos.x,
                y: mousePos.y,
                scale: isHovered ? 1.15 : 1
              }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            >
              <ellipse cx="78" cy="105" rx="9" ry="10" fill={eyeColor} />
              <ellipse cx="122" cy="105" rx="9" ry="10" fill={eyeColor} />
              
              {/* Pupil Highlights */}
              <circle cx="75" cy="102" r="3" fill="#ffffff" opacity="0.9" />
              <circle cx="119" cy="102" r="3" fill="#ffffff" opacity="0.9" />
            </motion.g>
          </g>
        )}

        {/* Smile */}
        <motion.path 
          d="M88 132 Q100 145, 112 132" 
          fill="none" 
          stroke={eyeColor} 
          strokeWidth="3" 
          strokeLinecap="round"
          animate={isHovered ? { d: "M84 130 Q100 152, 116 130" } : {}}
          transition={{ duration: 0.3 }}
        />
        
        {/* Cheeks blush when hovered */}
        {isHovered && (
          <g opacity="0.5" fill="#ff0077" filter="blur(2px)">
            <circle cx="62" cy="120" r="7" />
            <circle cx="138" cy="120" r="7" />
          </g>
        )}
      </svg>
    </motion.div>
  );
}

/* ============================================
   BENTO COMPONENTS
   ============================================ */
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015, boxShadow: "0px 10px 30px -5px rgba(0, 255, 65, 0.12)", borderColor: "rgba(0, 255, 65, 0.3)" }}
      transition={{ duration: 0.4, delay, type: "spring", stiffness: 100 }}
      className={`bento-card p-6 flex flex-col relative transition-all duration-300 border border-white/5 bg-black/60 backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatItem({ label, value, sub }: { label: string, value: string, sub?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">{label}</span>
      <span className="text-2xl font-bold font-mono text-white">{value}</span>
      {sub && <span className="text-[10px] text-neon-green font-mono">{sub}</span>}
    </div>
  );
}

function ActionRow({
  action,
  onClaim,
  claimed,
  loading
}: {
  action: typeof ACTIONS[keyof typeof ACTIONS],
  onClaim: () => void,
  claimed: boolean,
  loading: boolean
}) {
    const Icon = action.id.includes('twitter') ? Icons.Twitter :
                 action.id.includes('discord') ? Icons.DiscordLogo :
                 action.id.includes('wallet') ? Icons.Wallet :
                 Icons.Activity;

  return (
    <div className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon-green/30 transition-all hover:bg-white/10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${claimed ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
          <Icon />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200 group-hover:text-neon-green transition-colors">
            {action.id.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 font-mono">+{action.xp} XP</div>
        </div>
      </div>

      <button
        onClick={onClaim}
        disabled={claimed || loading}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
          claimed
            ? 'text-neon-green border border-neon-green/20 bg-neon-green/5 cursor-default'
            : 'text-white border border-white/20 hover:border-neon-green hover:text-neon-green hover:bg-neon-green/10'
        }`}
      >
        {loading ? 'SYNCING...' : claimed ? 'VERIFIED' : 'CLAIM'}
      </button>
    </div>
  );
}

/* ============================================
   MAIN PAGE
   ============================================ */
export default function Home() {
  const { user, connectWallet, isConnecting, claimAction, levelProgress, nextXP, error, isPiBrowser } = useWallet();
  const [claiming, setClaiming] = useState<string | null>(null);

  const handleClaim = async (actionId: string) => {
    if (claiming) return;
    playClickSound();
    setClaiming(actionId);
    const success = await claimAction(actionId);
    if (success) playSuccessSound();
    setClaiming(null);
  };

  const isClaimed = (actionId: string) => {
      return user?.actions?.some(a => a.type === actionId) ?? false;
  };

  return (
    <main className="min-h-screen bg-grid flex flex-col items-center p-4 md:p-8 relative">
      <div className="scanline" />

      {/* Sandbox Banner */}
      {process.env.NEXT_PUBLIC_PI_SANDBOX === "true" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono tracking-wider">
          SANDBOX MODE
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 md:mb-12 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-neon-green/20 flex items-center justify-center border border-neon-green/50">
            <span className="text-neon-green font-bold">A</span>
          </div>
          <span className="font-mono text-xl tracking-tighter">AXIOM<span className="text-gray-600">ID</span></span>
        </div>

        <div className="flex items-center gap-3">
          {isPiBrowser && !user && (
            <span className="text-[10px] font-mono text-electric-blue px-2 py-1 rounded-full border border-electric-blue/30 bg-electric-blue/5">
              Pi
            </span>
          )}
          {user && (
            <div className="flex items-center gap-4 px-4 py-2 glass-panel rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="font-mono text-xs text-neon-green">{user.walletAddress.startsWith("pi:") ? `pi:${user.walletAddress.slice(3, 9)}` : `${user.walletAddress.slice(0,6)}...${user.walletAddress.slice(-4)}`}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10 mt-10">

        {/* HERO SECTION */}
        <BentoCard className="md:col-span-2 min-h-[420px] justify-between overflow-hidden group p-8">
            <div className="absolute top-0 right-0 p-8 opacity-20 transition-opacity group-hover:opacity-40">
                <svg width="200" height="200" viewBox="0 0 100 100" className="animate-spin-slow">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                    <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
            </div>

            <div className="z-10 mt-auto">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">
                        V1.0.4 STABLE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        SECURE
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Identity for the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-electric-blue">
                        Post-Human Era.
                    </span>
                </h1>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                    Verify your humanity without sacrificing anonymity.
                    Establish your on-chain reputation score.
                </p>

                {!user ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => { playClickSound(); connectWallet(); }}
                            disabled={isConnecting}
                            className="btn-primary flex items-center gap-3 w-fit"
                        >
                            {isConnecting ? (
                                <>
                                    <span className="animate-spin">⟳</span> AUTHENTICATING...
                                </>
                            ) : (
                                <>
                                    <Icons.Wallet /> {isPiBrowser ? "CONNECT PI" : "CONNECT WALLET"}
                                </>
                            )}
                        </button>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center border border-neon-green">
                                <Icons.Check />
                            </div>
                            <div>
                                <div className="text-sm font-mono text-gray-400">STATUS</div>
                                <div className="text-xl font-bold text-neon-green">CONNECTED</div>
                            </div>
                        </div>
                        <Link
                            href={"/dashboard" as any}
                            onClick={() => playClickSound()}
                            className="btn-primary flex items-center justify-center gap-2 mt-2 w-full text-center"
                        >
                            🚀 ENTER AGENTIC OS
                        </Link>
                    </div>
                 )}
            </div>
        </BentoCard>

        {/* MASCOT CARD */}
        <BentoCard className="md:col-span-1 min-h-[420px] items-center justify-center bg-gradient-to-b from-white/5 to-transparent p-6" delay={0.1}>
            <AxiMascot mood={user?.tier === 'Sovereign' ? 'excited' : 'happy'} />
            {user && (
              <div className="mt-4 text-center">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Verification Level</span>
                <span className="text-sm font-bold text-neon-green font-mono">{user.tier.toUpperCase()}</span>
              </div>
            )}
        </BentoCard>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl flex justify-between items-center mt-16 py-6 border-t border-white/5 text-[10px] font-mono text-gray-500 z-10">
        <div>&copy; 2026 AxiomID. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </main>
  );
}
