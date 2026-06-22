"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/app/context/language-context";
import type { Route } from "next";

interface NavItem {
  href: Route;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HeaderProps {
  pathname: string;
  navItems: NavItem[];
}

export function Header({ pathname, navItems }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b animate-fadeIn"
      style={{
        background: "color-mix(in srgb, var(--bg-card) 90%, transparent)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <span className="text-lg sm:text-xl font-bold text-neon-green font-mono transition-colors group-hover:text-emerald-400">
                AXIOM
              </span>
              <span className="text-lg sm:text-xl font-bold text-surface font-mono transition-colors group-hover:text-white">
                ID
              </span>
            </Link>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {t("dashboard_title")}
              </h1>
              <p className="text-[10px] font-mono hidden sm:block" style={{ color: "var(--text-muted)" }}>
                Agent Identity Layer v1.0.0
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1" aria-label="Dashboard navigation">
            {navItems.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${
                  pathname === href
                    ? "text-neon-green bg-neon-green/10 shadow-[0_0_12px_rgba(34,197,94,0.05)] border border-neon-green/20"
                    : "text-subtle hover:text-surface hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
