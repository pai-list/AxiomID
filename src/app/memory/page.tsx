import type { Metadata } from "next";
import { StatusBar } from "@/components/os/StatusBar";
import { DesktopWindowManager } from "@/components/os/DesktopWindowManager";
import { SecurityCenter } from "@/components/os/SecurityCenter";

export const metadata: Metadata = {
  title: "AI Notes — 7-Layer Memory Engine | Aura OS",
  description: "Bitemporal L1-L7 AI Notes, WikiGraph explorer, and semantic recall for Aura OS.",
};

export default function MemoryPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 pt-16 pb-12" id="main-content" role="main">
      <StatusBar />
      <SecurityCenter />
      <DesktopWindowManager initialApp="notes" standalone />
    </main>
  );
}
