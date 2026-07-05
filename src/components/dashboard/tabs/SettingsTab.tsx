"use client";

import Link from "next/link";
import { useWallet } from "@/app/context/wallet-context";
import { Shield, User, Zap, AtSign } from "lucide-react";

/**
 * Settings tab — thin wrapper linking to existing /dashboard/settings page.
 * Shows user info and quick links. No duplication of the 679-line settings page.
 */
export function SettingsTab() {
  const { user } = useWallet();

  return (
    <div className="space-y-5">
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
