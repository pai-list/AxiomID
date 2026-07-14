"use client";

import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { QuickStatsRow } from "@/components/dashboard/QuickStatsRow";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DonateWithPiCard } from "@/components/dashboard/DonateWithPiCard";
import type { User } from "@/app/context/wallet-types";

interface HomeTabProps {
  user: User;
  levelProgress: number;
  agentStatus: "ACTIVE" | "INACTIVE" | "PAUSED";
  daysActive: number;
}

/**
 * Dashboard home tab — composes existing components.
 * No new UI elements. Pure composition.
 */
export function HomeTab({ user, levelProgress, agentStatus, daysActive }: HomeTabProps) {
  return (
    <div className="space-y-6">
      <WelcomeBanner
        username={user.piUsername || "User"}
        tier={user.tier}
        levelProgress={levelProgress}
        xp={user.xp}
      />
      <QuickStatsRow
        trustScore={user.trustScore}
        xp={user.xp}
        levelProgress={levelProgress}
        agentStatus={agentStatus}
        daysActive={daysActive}
      />
      <DonateWithPiCard />
      <RecentActivity user={{ ...user, kycStatus: user.kycStatus ?? undefined }} />
    </div>
  );
}
