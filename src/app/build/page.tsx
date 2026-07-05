"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Construction } from "lucide-react";

export default function BuildPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-electric-blue/30 selection:text-electric-blue flex flex-col font-sans">
      <Header />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-electric-blue/10 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

        <div className="relative z-10 max-w-xl w-full text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Construction className="w-8 h-8 text-electric-blue" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-sm">
            Skill Builder
          </h1>

          <p className="text-lg text-zinc-400">
            Design, deploy, and monetize custom AI skills.
            Our visual builder is currently under construction.
          </p>

          <div className="pt-8">
            <div className="bento-card p-6 bg-[#101217]/65 border border-white/5 backdrop-blur-md">
              <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
              <p className="text-zinc-500 text-sm">
                We are actively working on the visual editor and testing tools. Stay tuned for updates!
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
