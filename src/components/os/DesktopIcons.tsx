"use client";

import { toast } from "sonner";
import { useLanguage, type Language } from "@/app/context/language-context";
import { BUS_EVENTS, emit } from "./agent-bus";
import { SUBDOMAINS_CATALOG } from "./subdomains-catalog";

const SOON_MESSAGES: Record<Language, string> = {
  en: "Under active development — launching soon in AuraOS",
  ar: "قيد التطوير، سيتوفر قريباً في تحديث AuraOS القادم",
  zh: "正在积极开发中 — 即将在 AuraOS 下次更新推出",
  hi: "सक्रिय विकास के अधीन — AuraOS के अगले अपडेट में शीघ्र उपलब्ध",
};

const EXTRA_LABELS: Record<string, Record<Language, string>> = {
  subdomains: {
    en: "Subdomains",
    ar: "كل النطاقات",
    zh: "全部子域",
    hi: "सबडोमेन हब",
  },
};

const WINDOW_APPS = new Set(["agents", "gspace", "notes", "terminal", "subdomains"]);
const SUBDOMAIN_SHORTCUT_IDS = ["skills", "mcp", "earn", "learn"] as const;

type Gradient = readonly [string, string];

const PAIRS: Record<string, Gradient> = {
  agents: ["#06b6d4", "#3b82f6"],
  notes: ["#a855f7", "#ec4899"],
  terminal: ["#06b6d4", "#8b5cf6"],
  gspace: ["#22d3ee", "#6366f1"],
  skills: ["#10b981", "#22d3ee"],
  mcp: ["#8b5cf6", "#06b6d4"],
  earn: ["#fbbf24", "#f97316"],
  learn: ["#38bdf8", "#10b981"],
  subdomains: ["#38bdf8", "#a855f7"],
  settings: ["#06b6d4", "#10b981"],
  code: ["#10b981", "#06b6d4"],
  files: ["#f59e0b", "#ef4444"],
  automation: ["#a855f7", "#06b6d4"],
  autopilot: ["#10b981", "#3b82f6"],
  assistant: ["#f59e0b", "#a855f7"],
};

function Icon({ id, children }: { id: string; children: React.ReactNode }) {
  const [a, b] = PAIRS[id] ?? ["#06b6d4", "#3b82f6"];
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 drop-shadow-[0_2px_10px_rgba(0,240,255,0.22)]">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

function getExtraGlyph(id: (typeof SUBDOMAIN_SHORTCUT_IDS)[number], defs: (k: string) => string) {
  if (id === "skills") {
    return (
      <Icon id="skills">
        <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2z" stroke={defs("skills")} strokeWidth="1.8" fill={defs("skills")} fillOpacity="0.14" strokeLinejoin="round" />
        <path d="M13 7l-4 5h3l-1 5 4-5h-3l1-5z" fill={defs("skills")} />
      </Icon>
    );
  }
  if (id === "mcp") {
    return (
      <Icon id="mcp">
        <rect x="3" y="4" width="6" height="6" rx="1.5" stroke={defs("mcp")} strokeWidth="1.8" fill={defs("mcp")} fillOpacity="0.16" />
        <rect x="15" y="4" width="6" height="6" rx="1.5" stroke={defs("mcp")} strokeWidth="1.8" fill={defs("mcp")} fillOpacity="0.16" />
        <rect x="9" y="14" width="6" height="6" rx="1.5" stroke={defs("mcp")} strokeWidth="1.8" fill={defs("mcp")} fillOpacity="0.16" />
        <path d="M9 7h6M6 10l4.5 4M18 10l-4.5 4" stroke={defs("mcp")} strokeWidth="1.7" strokeLinecap="round" />
      </Icon>
    );
  }
  if (id === "earn") {
    return (
      <Icon id="earn">
        <circle cx="12" cy="12" r="9" stroke={defs("earn")} strokeWidth="1.8" fill={defs("earn")} fillOpacity="0.14" />
        <path d="M8 9h8M10 9v6M14 9v6" stroke={defs("earn")} strokeWidth="2" strokeLinecap="round" />
      </Icon>
    );
  }
  return (
    <Icon id="learn">
      <path d="M4 5.5A2.5 2.5 0 016.5 3H12v16H6.5A2.5 2.5 0 004 21.5V5.5zM20 5.5A2.5 2.5 0 0017.5 3H12v16h5.5A2.5 2.5 0 0120 21.5V5.5z" stroke={defs("learn")} strokeWidth="1.8" fill={defs("learn")} fillOpacity="0.14" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="1.4" fill={defs("learn")} />
    </Icon>
  );
}

type Props = {
  labels: Record<string, string>;
};

export function DesktopIcons({ labels }: Props) {
  const { t, language } = useLanguage();
  const lang: Language = language in SOON_MESSAGES ? language : "en";
  const translatedAgents = t("desktop_agents");
  const useLiveTranslations = Boolean(translatedAgents && translatedAgents !== "desktop_agents");
  const translatedSoon = t("desktop_soon");
  const soonLabel =
    useLiveTranslations && translatedSoon !== "desktop_soon" ? translatedSoon : labels.soon;
  const defs = (id: string) => `url(#g-${id})`;

  const subdomainById = Object.fromEntries(SUBDOMAINS_CATALOG.map((item) => [item.id, item]));

  const items: Array<{
    id: string;
    href?: string;
    hostHint?: string;
    isExternal?: boolean;
    featured?: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: "agents",
      href: "/dashboard",
      icon: (
        <Icon id="agents">
          <circle cx="12" cy="8" r="3" stroke={defs("agents")} strokeWidth="2" fill={defs("agents")} fillOpacity="0.18" />
          <path d="M12 11v4m0 0l-3 3m3-3l3 3M6 8a6 6 0 0112 0" stroke={defs("agents")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="2" fill={defs("agents")} opacity="0.7" />
          <circle cx="18" cy="18" r="2" fill={defs("agents")} opacity="0.7" />
        </Icon>
      ),
    },
    {
      id: "gspace",
      href: "https://gspace.axiomid.app",
      hostHint: "gspace",
      isExternal: true,
      featured: true,
      icon: (
        <Icon id="gspace">
          <circle cx="12" cy="12" r="8.5" stroke={defs("gspace")} strokeWidth="1.75" fill={defs("gspace")} fillOpacity="0.14" />
          <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-24 12 12)" stroke={defs("gspace")} strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="3.4" ry="8.5" transform="rotate(18 12 12)" stroke={defs("gspace")} strokeWidth="1.1" opacity="0.6" />
          <circle cx="12" cy="12" r="2.4" fill={defs("gspace")} />
          <circle cx="18.2" cy="8.2" r="1.35" fill="#34d399" />
          <circle cx="5.8" cy="15.8" r="1.2" fill="#22d3ee" />
          <circle cx="16.5" cy="17.5" r="1.15" fill="#818cf8" />
        </Icon>
      ),
    },
    {
      id: "notes",
      href: "https://memory.axiomid.app",
      hostHint: "memory",
      icon: (
        <Icon id="notes">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke={defs("notes")} strokeWidth="2" fill={defs("notes")} fillOpacity="0.14" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke={defs("notes")} strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="7" r="2" fill={defs("notes")} opacity="0.85" />
        </Icon>
      ),
    },
    {
      id: "terminal",
      href: "https://harness.axiomid.app",
      hostHint: "harness",
      icon: (
        <Icon id="terminal">
          <rect x="2" y="4" width="20" height="16" rx="3" stroke={defs("terminal")} strokeWidth="2" fill={defs("terminal")} fillOpacity="0.14" />
          <path d="M6 9l4 3-4 3M12 15h6" stroke={defs("terminal")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19" cy="7" r="1.5" fill={defs("terminal")} opacity="0.85" />
        </Icon>
      ),
    },
    ...SUBDOMAIN_SHORTCUT_IDS.map((id) => {
      const entry = subdomainById[id];
      return {
        id,
        href: entry?.href ?? `https://${id}.axiomid.app`,
        hostHint: id,
        isExternal: true,
        icon: getExtraGlyph(id, defs),
      };
    }),
    {
      id: "subdomains",
      href: "https://index.axiomid.app",
      hostHint: "16 live",
      icon: (
        <Icon id="subdomains">
          <rect x="3" y="3" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.22" />
          <rect x="9.5" y="3" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.14" />
          <rect x="16" y="3" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.22" />
          <rect x="3" y="9.5" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.14" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.3" />
          <rect x="16" y="9.5" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.14" />
          <rect x="3" y="16" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.22" />
          <rect x="9.5" y="16" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.14" />
          <rect x="16" y="16" width="5" height="5" rx="1.5" stroke={defs("subdomains")} strokeWidth="1.8" fill={defs("subdomains")} fillOpacity="0.22" />
        </Icon>
      ),
    },
    {
      id: "settings",
      href: "/dashboard/settings",
      icon: (
        <Icon id="settings">
          <circle cx="12" cy="12" r="3" stroke={defs("settings")} strokeWidth="2" fill={defs("settings")} fillOpacity="0.2" />
          <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" stroke={defs("settings")} strokeWidth="2" strokeLinecap="round" />
        </Icon>
      ),
    },
    {
      id: "code",
      icon: (
        <Icon id="code">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={defs("code")} strokeWidth="2" fill={defs("code")} fillOpacity="0.1" />
          <path d="M8 9l-2 3 2 3M16 9l2 3-2 3M13 7l-2 10" stroke={defs("code")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Icon>
      ),
    },
    {
      id: "files",
      icon: (
        <Icon id="files">
          <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={defs("files")} strokeWidth="2" fill={defs("files")} fillOpacity="0.12" />
          <path d="M7 13h10M7 16h6" stroke={defs("files")} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </Icon>
      ),
    },
    {
      id: "automation",
      icon: (
        <Icon id="automation">
          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke={defs("automation")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={defs("automation")} fillOpacity="0.14" />
          <circle cx="13" cy="2" r="1.5" fill={defs("automation")} opacity="0.8" />
          <circle cx="12" cy="22" r="1.5" fill={defs("automation")} opacity="0.8" />
        </Icon>
      ),
    },
    {
      id: "autopilot",
      icon: (
        <Icon id="autopilot">
          <path d="M12 2l-8 8h5v10h6V10h5l-8-8z" stroke={defs("autopilot")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={defs("autopilot")} fillOpacity="0.14" />
          <circle cx="12" cy="2" r="1.5" fill={defs("autopilot")} />
          <path d="M7 14l-2 2M17 14l2 2" stroke={defs("autopilot")} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </Icon>
      ),
    },
    {
      id: "assistant",
      icon: (
        <Icon id="assistant">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={defs("assistant")} strokeWidth="2" fill={defs("assistant")} fillOpacity="0.14" />
          <circle cx="9" cy="10" r="1.5" fill={defs("assistant")} />
          <circle cx="15" cy="10" r="1.5" fill={defs("assistant")} />
          <path d="M9 13h6" stroke={defs("assistant")} strokeWidth="2" strokeLinecap="round" />
        </Icon>
      ),
    },
  ];

  return (
    <div
      className="flex max-h-[calc(100vh-145px)] flex-col flex-wrap items-start gap-2.5 sm:gap-3.5"
      role="list"
      aria-label="Aura OS desktop"
    >
      {items.map(({ id, href, hostHint, isExternal, featured, icon }) => {
        const translatedLabel = t(`desktop_${id}`);
        const catalogLabel = subdomainById[id]?.locales[lang]?.name ?? EXTRA_LABELS[id]?.[lang];
        const label =
          useLiveTranslations && translatedLabel !== `desktop_${id}`
            ? translatedLabel
            : useLiveTranslations && catalogLabel
              ? catalogLabel
              : (labels[id] ?? subdomainById[id]?.locales.en.name ?? EXTRA_LABELS[id]?.en ?? id);
        const soon = !href;
        const [gradStart, gradEnd] = PAIRS[id] ?? ["#06b6d4", "#3b82f6"];
        const resolvedHref = href;

        return (
          <div
            key={id}
            role="listitem"
            className={`group flex w-24 sm:w-28 flex-col items-center gap-2 rounded-2xl p-2 transition-all duration-200 ${
              soon
                ? "opacity-55 hover:opacity-95 hover:bg-white/5"
                : "hover:bg-white/[0.06] hover:shadow-[0_0_24px_rgba(0,240,255,0.14)]"
            }`}
          >
            {href ? (
              <a
                href={resolvedHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (WINDOW_APPS.has(id) && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    emit(BUS_EVENTS.openApp, id);
                  }
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl text-cyan-400 transition-transform duration-200 group-hover:scale-105 group-hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label={label}
              >
                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-[20px] border backdrop-blur-xl transition-all group-hover:border-cyan-400/50 ${
                    featured
                      ? "border-cyan-400/45 ring-1 ring-inset ring-cyan-300/30 shadow-[0_0_28px_rgba(34,211,238,0.28)]"
                      : "border-white/15 ring-1 ring-inset ring-white/10 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${gradStart}26 0%, ${gradEnd}12 100%)`,
                  }}
                >
                  {icon}
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  />
                </div>
                <span className="text-[11px] font-semibold text-white drop-shadow-lg text-center leading-tight">
                  {label}
                </span>
                {hostHint && (
                  <span className="text-[9px] font-mono text-white/45 group-hover:text-cyan-300/80 truncate max-w-[92px]">
                    {hostHint}
                  </span>
                )}
              </a>
            ) : (
              <div
                onClick={() =>
                  toast.info(
                    `${label} — ${
                      soonLabel === "قريباً" ? SOON_MESSAGES.ar : (SOON_MESSAGES[lang] ?? SOON_MESSAGES.en)
                    }`,
                  )
                }
                className="flex flex-col items-center gap-1.5 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl transition-transform duration-200 group-hover:scale-105"
                aria-label={label}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 ring-1 ring-inset ring-white/5 shadow-lg backdrop-blur-xl group-hover:border-white/25"
                  style={{
                    background: `linear-gradient(135deg, ${gradStart}14 0%, ${gradEnd}08 100%)`,
                  }}
                >
                  {icon}
                </div>
                <span className="text-[11px] font-semibold text-white/80 drop-shadow-lg text-center leading-tight">
                  {label}{" "}
                  <span className="inline-block rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                    {soonLabel}
                  </span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
