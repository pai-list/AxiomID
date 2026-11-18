import type { Metadata } from "next";
import { StatusBar } from "@/components/os/StatusBar";
import { DesktopWindowManager } from "@/components/os/DesktopWindowManager";
import { SecurityCenter } from "@/components/os/SecurityCenter";

export const metadata: Metadata = {
  title: "AI Terminal — Harness Forge | Aura OS",
  description: "Interactive Harness Forge terminal, eval suites, sandbox runtimes, and verification gates.",
};

export default function HarnessPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 pt-16 pb-12" id="main-content" role="main">
      <StatusBar />
      <SecurityCenter />
      <DesktopWindowManager initialApp="terminal" standalone />
    </main>
  );
}
