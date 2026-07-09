"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/app/context/wallet-context";
import { Shield, User, Zap, AtSign, Globe, Copy, Check } from "lucide-react";

/**
 * Settings tab — thin wrapper linking to existing /dashboard/settings page.
 * Shows user info, vanity URL, and quick links.
 */
export function SettingsTab() {
  const { user } = useWallet();
  const [copied, setCopied] = useState(false);

  const vanityUrl = user?.piUsername
    ? `https://${user.piUsername}.axiomid.app`
    : null;

  const handleCopy = async () => {
    if (!vanityUrl) return;
    await navigator.clipboard.writeText(vanityUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Vanity URL */}
      {vanityUrl && (
        <div className="bento-card p-5">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
            Your Vanity URL
          </h3>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <a
              href={vanityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-emerald-400 hover:underline truncate focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none rounded px-1"
            >
              {vanityUrl}
            </a>
            <button
              onClick={handleCopy}
              className="ml-auto p-1.5 rounded hover:bg-white/[0.05] transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Share this URL to show your passport and trust score.
          </p>
        </div>
      )}

      {/* User info summary */}
      <div className="bento-card p-5">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
          Account
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-mono text-zinc-300">{user?.piUsername || "Not set"}</span>
          </div>
          <div className="flex items-center gap-3">
            <AtSign className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500">
              {user?.walletAddress
                ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick links to full settings */}
      <div className="bento-card p-5">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
          Settings
        </h3>
        <div className="space-y-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <Shield className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-300">Full Settings →</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <Zap className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-300">XP Ledger →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
