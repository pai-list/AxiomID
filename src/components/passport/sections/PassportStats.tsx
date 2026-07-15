"use client";

import React from "react";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { useLanguage } from "@/app/context/language-context";

interface PassportStatsProps {
  trustScore: number;
  xp: number;
  issuedDate: string;
}

export function PassportStats({ trustScore, xp, issuedDate }: PassportStatsProps) {
  const { t } = useLanguage();
  const parsedDate = new Date(issuedDate);
  const formattedDate = isNaN(parsedDate.getTime())
    ? "N/A"
    : parsedDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="rounded-xl p-2 sm:p-3 border text-center bento-card-2026 glass-card stat-card-glow blue">
        <span className="text-[9px] font-mono block text-text-muted">{t('label_trust')}</span>
        <TrustScoreGauge score={trustScore} size={64} />
      </div>
      <div className="rounded-xl p-2 sm:p-3 border flex flex-col items-center justify-center bento-card-2026 glass-card stat-card-glow purple animate-holographic">
        <span className="text-[9px] font-mono block text-text-muted">{t('label_xp')}</span>
        <span className="text-base sm:text-xl font-bold font-mono text-text-primary">{xp.toLocaleString()}</span>
      </div>
      <div className="rounded-xl p-2 sm:p-3 border flex flex-col items-center justify-center text-center bento-card-2026 glass-card">
        <span className="text-[9px] font-mono block text-text-muted">{t('label_issued')}</span>
        <span className="text-[11px] font-mono text-text-primary">{formattedDate}</span>
      </div>
    </div>
  );
}
