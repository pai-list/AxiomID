"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function MarketplaceSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading marketplace">
      <div className="flex gap-3">
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} height="280px" />
        ))}
      </div>
    </div>
  );
}
