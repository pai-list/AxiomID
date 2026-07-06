import { Shield } from "lucide-react";
import HeroDemo from "@/components/HeroDemo";

interface HeroSectionProps {
  t: (key: string) => string;
}

export default function HeroSection({ t }: HeroSectionProps) {
  return (
    <div className="w-full max-w-6xl px-4 sm:px-6 pt-24 sm:pt-32 pb-16 z-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Left: Copy & CTA */}
        <div className="md:col-span-7 space-y-6 sm:space-y-8 animate-fade-in text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mx-auto md:mx-0 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-semibold uppercase">
              {t("landing_pi_badge")}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              <span className="block animate-slide-up" style={{ animationDelay: "0.1s" }}>
                Create your
              </span>
              <span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-emerald-400 to-axiom-purple animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                AI Identity
              </span>
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl mx-auto md:mx-0 animate-slide-up leading-relaxed mt-4"
              style={{ animationDelay: "0.3s" }}
            >
              Establish a cryptographically verified identity for your autonomous agents. One click to deploy a sovereign
              W3C DID, Passport, and live endpoint.
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-slide-up justify-center md:justify-start"
            style={{ animationDelay: "0.4s" }}
          >
            <a
              href="/claim"
              className="btn-primary py-4 px-8 text-sm sm:text-base group relative overflow-hidden w-full sm:w-auto font-mono tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create My AI Agent
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>
            <a
              href="/docs"
              className="text-xs sm:text-sm font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-3"
            >
              <Shield className="w-4 h-4 opacity-50" />
              Explore the Protocol
            </a>
          </div>

          <div
            className="flex items-center justify-center md:justify-start gap-4 pt-6 animate-slide-up text-[10px] font-mono text-zinc-500"
            style={{ animationDelay: "0.5s" }}
          >
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

        {/* Right: Animated Demo */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-sm relative animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
            <div
              className="absolute -inset-8 bg-gradient-to-tr from-emerald-500/15 via-electric-blue/15 to-axiom-purple/15 rounded-[48px] blur-3xl opacity-50 animate-pulse pointer-events-none"
              style={{ animationDuration: "6s" }}
            />
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/5 via-electric-blue/5 to-axiom-purple/5 rounded-[32px] blur-xl opacity-40 pointer-events-none" />
            <HeroDemo />
          </div>
        </div>
      </div>
    </div>
  );
}
