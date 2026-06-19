"use client";

import React from "react";
import { useLanguage } from "@/app/context/language-context";

interface PassportFooterProps {
  issuedDate: string;
}

/**
 * Renders a footer displaying passport verification information and the issued date.
 *
 * @param issuedDate - The date string to display; shows "N/A" if the date cannot be parsed.
 * @returns A footer element.
 */
export function PassportFooter({ issuedDate }: PassportFooterProps) {
  const { t } = useLanguage();
  const parsedDate = new Date(issuedDate);
  const formattedDate = isNaN(parsedDate.getTime())
    ? "N/A"
    : parsedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <footer className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-card)' }}>
      <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
        {t('passport_footer_verified')}
      </span>
      <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
        {formattedDate}
      </span>
    </footer>
  );
}
