"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/language-context";

interface FooterProps {
  minimal?: boolean;
  copyright?: string;
}

/**
 * Shared Footer component for all AxiomID pages.
 * Supports standard navigation links and a minimal mode for legal/utility pages.
 */
export default function Footer({ minimal = false, copyright }: FooterProps) {
  const { t } = useLanguage();
  const defaultCopy = "© 2026 AxiomID. All rights reserved.";

  if (minimal) {
    return (
      <footer 
        className="w-full border-t py-6 px-6 text-[10px] font-mono text-center mt-12" 
        style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
      >
        {copyright || defaultCopy}
      </footer>
    );
  }

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mt-16 sm:mt-24 py-8 border-t text-[11px] font-mono z-10 gap-6 px-4 sm:px-6 mx-auto transition-colors duration-300"
      style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
    >
      <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left" style={{ color: 'var(--text-muted)' }}>
        <span className="opacity-80">{copyright || defaultCopy}</span>
        <span className="text-[9px] opacity-50 uppercase tracking-widest">L0 Authority • Axiom Protocol</span>
      </div>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 justify-center items-center">
        <Link href="/privacy" className="relative text-subtle hover:text-surface transition-colors group">
          {t("nav_privacy")}
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-electric-blue transition-all group-hover:w-full" />
        </Link>
        <Link href="/terms" className="relative text-subtle hover:text-surface transition-colors group">
          {t("nav_terms")}
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-electric-blue transition-all group-hover:w-full" />
        </Link>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-500">
          <div className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[9px] uppercase tracking-tighter">v{process.env.NEXT_PUBLIC_APP_VERSION || "0.1.2"}</span>
        </div>
      </nav>
    </motion.footer>
  );
}
