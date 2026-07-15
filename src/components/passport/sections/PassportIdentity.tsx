"use client";

import { Copy } from "lucide-react";
import { useLanguage } from "@/app/context/language-context";

interface PassportIdentityProps {
  username: string;
  did: string;
  displayAddress?: string | null;
  shortAddress: string;
  agentName?: string;
  agentStatus?: string;
  copyToClipboard: (text: string) => void;
}

/**
 * Renders a passport identity UI displaying the user's username, DID, wallet address, and optional agent information.
 *
 * Provides copy controls for the DID and wallet address. The agent information section is rendered only when an agent name is provided, displaying the agent's status in a badge.
 */
export function PassportIdentity({
  username,
  did,
  displayAddress,
  shortAddress,
  agentName,
  agentStatus,
  copyToClipboard,
}: PassportIdentityProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Name + DID */}
      <div className="text-center">
        <h3 className="text-lg font-bold font-mono text-text-primary">{username}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-[10px] font-mono break-all text-text-muted">{did}</p>
          <button type="button" onClick={() => copyToClipboard(did)} className="text-text-muted hover:text-primary hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" aria-label="Copy DID"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Wallet */}
      <div className="w-full rounded-lg px-3 py-2 border bento-card-2026 glass-card">
        <span className="text-[9px] font-mono block text-text-muted">{t('label_wallet')}</span>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neon-green font-mono animate-pulse-glow">{shortAddress}</span>
          {displayAddress && <button type="button" onClick={() => copyToClipboard(displayAddress)} className="text-text-muted hover:text-primary hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" aria-label="Copy Wallet Address"><Copy className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      {/* Agent info */}
      {agentName && (
        <div className="w-full rounded-lg px-3 py-2 border bento-card-2026 glass-card">
          <span className="text-[9px] font-mono block text-text-muted">{t('label_agent')}</span>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-primary">{agentName}</span>
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
              agentStatus?.toUpperCase() === "ACTIVE"
                ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                : "border"
            }`} style={agentStatus?.toUpperCase() !== "ACTIVE" ? { background: 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--card-border)' } : undefined}>
              {agentStatus?.toUpperCase() || t('status_none')}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
