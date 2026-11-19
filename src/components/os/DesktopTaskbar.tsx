"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage, type Language } from "@/app/context/language-context";
import {
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  LayoutGrid,
  NotebookPen,
  Terminal,
} from "lucide-react";
import { BUS_EVENTS, emit, on } from "./agent-bus";
import { SUBDOMAINS_CATALOG, resolveSubdomainHref } from "./subdomains-catalog";

const LAUNCHERS = [
  { key: "control_center", label: "Control Center", href: "/dashboard", icon: LayoutGrid, app: "agents" as const },
  { key: "desktop_gspace", label: "PAI Gspace", href: "https://gspace.axiomid.app", icon: Globe, app: "gspace" as const },
  { key: "plans", label: "Plans", href: "/plans", icon: Cpu },
  { key: "desktop_terminal", label: "AI Terminal", href: "https://harness.axiomid.app", icon: Terminal, app: "terminal" as const },
  { key: "desktop_notes", label: "AI Notes", href: "https://memory.axiomid.app", icon: NotebookPen, app: "notes" as const },
  { key: "desktop_subdomains", label: "Subdomains", href: "https://index.axiomid.app", icon: Compass, app: "subdomains" as const },
  { key: "github", label: "GitHub", href: "https://github.com/pai-list", icon: ExternalLink },
];

const LAUNCHER_SUBDOMAIN_IDS = new Set([
  "skills",
  "mcp",
  "earn",
  "learn",
  "openid",
  "aip",
  "ppp",
  "node",
  "agdp",
  "mail",
  "piverify",
]);

const SUBDOMAINS_SECTION_LABEL: Record<Language, { core: string; mesh: string; subdomainsTab: string }> = {
  en: { core: "AuraOS Core", mesh: "Live *.axiomid.app Subdomains", subdomainsTab: "Subdomains" },
  ar: { core: "تطبيقات النظام", mesh: "النطاقات الفرعية الحية", subdomainsTab: "كل النطاقات" },
  zh: { core: "核心桌面应用", mesh: "实时子域服务网", subdomainsTab: "全部子域" },
  hi: { core: "कोर ऐप्स", mesh: "लाइव सबडोमेन नेटवर्क", subdomainsTab: "सबडोमेन" },
};

const LANG_ORDER: readonly Language[] = ["en", "ar", "zh", "hi"];
const APP_TITLE_KEYS: Record<string, string> = {
  terminal: "desktop_terminal",
  notes: "desktop_notes",
  agents: "desktop_agents",
  gspace: "desktop_gspace",
  subdomains: "desktop_subdomains",
};
const DATE_LOCALES: Record<Language, string> = {
  en: "en-US",
  ar: "ar-SA",
  zh: "zh-CN",
  hi: "hi-IN",
};

export function DesktopTaskbar() {
  const { t, language, setLanguage } = useLanguage();
  const [now, setNow] = useState("");
  const [cpu, setCpu] = useState<string | null>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [windowState, setWindowState] = useState<{ openApps: string[]; activeApp: string | null }>({
    openApps: [],
    activeApp: null,
  });
  const launcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return on<{ openApps?: string[]; activeApp?: string | null }>(BUS_EVENTS.windowState, (payload) => {
      if (!payload) return;
      setWindowState({
        openApps: Array.isArray(payload.openApps) ? payload.openApps : [],
        activeApp: payload.activeApp ?? null,
      });
    });
  }, []);

  useEffect(() => {
    const locale = DATE_LOCALES[language] ?? "en-US";
    const tick = () =>
      setNow(
        new Date().toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [language]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    fetch("/api/telemetry", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        clearTimeout(timer);
        if (alive) {
          const attention = d?.globalWorkspace?.attention;
          setCpu(attention != null ? `${attention}%` : "98%");
        }
      })
      .catch(() => {
        clearTimeout(timer);
        if (alive) setCpu("—");
      });

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (launcherRef.current && !launcherRef.current.contains(event.target as Node)) {
        setLauncherOpen(false);
      }
    }
    if (launcherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [launcherOpen]);

  const lang: Language = language in SUBDOMAINS_SECTION_LABEL ? language : "en";
  const sectionLabels = SUBDOMAINS_SECTION_LABEL[lang];
  const meshLaunchers = SUBDOMAINS_CATALOG.filter((entry) => LAUNCHER_SUBDOMAIN_IDS.has(entry.id));

  return (
    <div ref={launcherRef} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      {/* App Launcher popup */}
      {launcherOpen && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,540px)] space-y-3 p-3.5 rounded-2xl bg-[#0d0d16]/95 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_0_50px_rgba(0,240,255,0.25)] animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-label="PAI Ecosystem Launchers"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/80 px-1">
            {sectionLabels.core}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {LAUNCHERS.map(({ key, label, href, icon: Icon, app }) => {
              const translated = t(key);
              const fallback = key === "desktop_subdomains" ? sectionLabels.subdomainsTab : label;
              const displayLabel = translated && translated !== key ? translated : fallback;
              return (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    setLauncherOpen(false);
                    if (app && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                      e.preventDefault();
                      emit(BUS_EVENTS.openApp, app);
                    }
                  }}
                  className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 group-hover:bg-cyan-400/20 group-hover:scale-105 transition-all text-cyan-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-mono text-white/85 text-center leading-tight">
                    {displayLabel}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/60">
                <Database className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                {sectionLabels.mesh}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
              {meshLaunchers.map((entry) => {
                const [gStart, gEnd] = entry.gradient;
                const localized = entry.locales[lang];
                return (
                  <a
                    key={entry.id}
                    href={resolveSubdomainHref(entry.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setLauncherOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 transition-colors hover:border-cyan-400/40 hover:bg-white/[0.08]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${gStart}, ${gEnd})` }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[10px] font-semibold text-white">
                        {localized.name}
                      </div>
                      <div className="truncate font-mono text-[9px] text-cyan-300/70">
                        {entry.host}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Taskbar Bar */}
      <div
        className="flex items-center gap-3 rounded-3xl border-2 border-cyan-400/30 bg-[#0f0f1a]/95 px-4 py-2 shadow-[0_0_40px_rgba(0,255,255,0.3)] backdrop-blur-2xl"
        role="navigation"
        aria-label={t("aura_os")}
      >
        <div
          tabIndex={0}
          onClick={() => setLauncherOpen(!launcherOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setLauncherOpen((open) => !open);
            } else if (e.key === "Escape") {
              setLauncherOpen(false);
            }
          }}
          className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-400/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Aura App Launcher"
          aria-expanded={launcherOpen}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-cyan-400/20 text-cyan-400" aria-hidden="true">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <svg viewBox="0 0 24 24" className="absolute h-4 w-4 text-cyan-400" aria-hidden="true">
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
          </svg>
        </div>

        <div className="h-10 w-px bg-white/30" aria-hidden="true" />
        {windowState.openApps.length === 0 ? (
          <span className="px-4 text-xs text-slate-400">{t("desktop_no_apps")}</span>
        ) : (
          <div className="flex items-center gap-1.5 px-1" role="tablist" aria-label="Open apps">
            {windowState.openApps.map((appId) => {
              const titleKey = APP_TITLE_KEYS[appId] ?? appId;
              const translatedTitle = t(titleKey);
              const fallback =
                appId === "subdomains" ? sectionLabels.subdomainsTab : appId;
              const label = translatedTitle !== titleKey ? translatedTitle : fallback;
              const isActive = windowState.activeApp === appId;
              return (
                <div
                  key={appId}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => emit(BUS_EVENTS.openApp, appId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      emit(BUS_EVENTS.openApp, appId);
                    }
                  }}
                  className={`cursor-pointer rounded-xl px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                    isActive
                      ? "border border-cyan-400/40 bg-cyan-400/20 text-cyan-200"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}
        <div className="h-10 w-px bg-white/30" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <div
            tabIndex={0}
            aria-label="Cycle display language"
            data-testid="taskbar-lang-cycle"
            onClick={() => {
              const idx = LANG_ORDER.indexOf(language);
              const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
              setLanguage(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const idx = LANG_ORDER.indexOf(language);
                const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
                setLanguage(next);
              }
            }}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white/5 px-2.5 text-xs font-mono uppercase text-white/75 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>{(language || "en").toUpperCase()}</span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl bg-cyan-400/10 px-3 transition-colors hover:bg-cyan-400/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect width="16" height="16" x="4" y="4" rx="2" />
              <rect width="6" height="6" x="9" y="9" rx="1" />
              <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
            </svg>
            <span className="text-xs font-medium text-cyan-400">{t("desktop_cpu")} {cpu ?? "…"}</span>
          </div>
        </div>

        <div className="h-10 w-px bg-white/30" aria-hidden="true" />

        <button
          type="button"
          aria-label="System time"
          className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/10 to-violet-400/5 px-4 py-1 transition-colors hover:from-violet-400/20 hover:to-violet-400/10"
        >
          <span className="text-sm font-bold text-violet-400">{now.split(",")[1]?.trim() ?? ""}</span>
          <span className="text-[10px] text-slate-500">{now.split(",")[0]}</span>
        </button>
      </div>
    </div>
  );
}
