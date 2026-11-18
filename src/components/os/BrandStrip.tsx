"use client";

import Image from "next/image";
import { useLanguage } from "@/app/context/language-context";

const PARTNERS = [
  {
    name: "Vercel",
    href: "https://vercel.com",
    src: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2L2 21h20L12 2z'/%3E%3C/svg%3E",
    alt: "Vercel",
  },
  {
    name: "Cloudflare",
    href: "https://www.cloudflare.com",
    src: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f38020'%3E%3Cpath d='M16.5 14h.75a2.75 2.75 0 0 0 .3-5.48A5.5 5.5 0 0 0 6.6 9.5a3.5 3.5 0 0 0 .4 6.98h9.5a1.25 1.25 0 0 0 0-2.48z'/%3E%3C/svg%3E",
    alt: "Cloudflare",
  },
  {
    name: "Google Gemini",
    href: "https://gemini.google.com",
    src: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2360a5fa'%3E%3Cpath d='M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10z'/%3E%3C/svg%3E",
    alt: "Google Gemini",
  },
  {
    name: "Pi Network",
    href: "https://minepi.com",
    src: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fbbf24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23fbbf24' stroke-width='2'/%3E%3Cpath d='M8 9h8v2h-2v5h-2v-5h-2v5H8V9z'/%3E%3C/svg%3E",
    alt: "Pi Network",
  },
];

export function BrandStrip() {
  const { t, language } = useLanguage();
  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <footer
      suppressHydrationWarning
      className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-6 sm:translate-x-0 z-40 px-3 py-1.5 pointer-events-none"
      dir={dir}
      role="contentinfo"
      aria-label={t("technology_partners")}
    >
      <div className="mx-auto max-w-5xl flex flex-col items-center sm:items-end gap-1.5">
        <p suppressHydrationWarning className="text-[10px] font-mono text-white/40 tracking-wider uppercase">
          {t("built_on")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          {PARTNERS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label={p.alt}
            >
              <Image src={p.src} alt={p.alt} width={24} height={24} className="object-contain" unoptimized />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}