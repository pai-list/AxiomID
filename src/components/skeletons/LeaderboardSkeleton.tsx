"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading leaderboard">
      <div className="flex justify-center gap-4">
        <SkeletonCard width="200px" height="280px" />
        <SkeletonCard width="220px" height="300px" />
        <SkeletonCard width="200px" height="280px" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <SkeletonLine width="2rem" height="2rem" className="rounded-full" />
            <SkeletonCircle size="2.5rem" />
            <SkeletonLine width="40%" height="1rem" />
            <SkeletonLine width="20%" height="1rem" className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
