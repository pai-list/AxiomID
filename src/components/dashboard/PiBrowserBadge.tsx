"use client";

import { useLanguage } from "@/app/context/language-context";

interface PiBrowserBadgeProps {
  isPiBrowser: boolean;
  user: unknown;
}

export default function PiBrowserBadge({ isPiBrowser, user }: PiBrowserBadgeProps) {
  const { language } = useLanguage();
  if (!isPiBrowser || user) return null;

  const t = (en: string, ar: string) => (language === "en" ? en : ar);

  return (
    <span
      className="hidden sm:inline text-[10px] font-mono px-2 py-1 rounded border"
      style={{
        background: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 0.2)",
        color: "#3b82f6",
      }}
    >
      {t("Pi Browser", "متصفح Pi")}
    </span>
  );
}
