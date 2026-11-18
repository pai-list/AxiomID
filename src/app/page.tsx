import { Metadata } from "next";
import { getTranslation } from "@/i18n";
import { cookies, headers } from "next/headers";
import { DesktopCanvas } from "@/components/os/DesktopCanvas";
import { DesktopIcons } from "@/components/os/DesktopIcons";
import { DesktopTaskbar } from "@/components/os/DesktopTaskbar";
import { DesktopWindowManager } from "@/components/os/DesktopWindowManager";
import { StatusBar } from "@/components/os/StatusBar";
import { BrandStrip } from "@/components/os/BrandStrip";
import { WallpaperMenu } from "@/components/os/WallpaperMenu";
import { SecurityCenter } from "@/components/os/SecurityCenter";

export const revalidate = 60;

type SupportedLang = "en" | "ar" | "zh" | "hi";

function isSupportedLang(value: string | undefined): value is SupportedLang {
  return value === "en" || value === "ar" || value === "zh" || value === "hi";
}

async function resolveServerLanguage(): Promise<SupportedLang> {
  const cookieStore = typeof cookies === "function" ? await cookies().catch(() => null) : null;
  const cookieLang = cookieStore?.get?.("axiomid-language")?.value;
  if (isSupportedLang(cookieLang)) {
    return cookieLang;
  }

  const headersList = await headers();
  const acceptLang = (headersList.get("accept-language") || "").toLowerCase();
  if (acceptLang.startsWith("ar")) return "ar";
  if (acceptLang.startsWith("zh")) return "zh";
  if (acceptLang.startsWith("hi")) return "hi";
  return "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await resolveServerLanguage();
  const t = (key: string) => getTranslation(lang, key);

  return {
    title: t("aura_os_title"),
    description: t("aura_os_desc"),
  };
}

const LABEL_KEYS = [
  "agents",
  "notes",
  "code",
  "files",
  "terminal",
  "automation",
  "autopilot",
  "assistant",
  "settings",
  "soon",
] as const;

export default async function Home() {
  const lang = await resolveServerLanguage();
  const t = (key: string) => getTranslation(lang, key);

  const labels = Object.fromEntries(LABEL_KEYS.map((k) => [k, t(`desktop_${k}`)]));

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]" id="main-content" role="main">
      {/* Ambient background: particle canvas + orbs + grid */}
      <DesktopCanvas />
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
        aria-hidden="true"
      />

      {/* Top status bar */}
      <StatusBar />

      {/* Desktop icon grid */}
      <div className="absolute left-6 top-14 z-10">
        <DesktopIcons labels={labels} />
      </div>

      {/* Taskbar */}
      <DesktopTaskbar />

      <DesktopWindowManager />

      <SecurityCenter />

      <BrandStrip />

      <WallpaperMenu />
    </main>
  );
}
