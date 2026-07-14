"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function ExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading explorer">
      <SkeletonLine width="100%" height="3rem" className="rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height="200px" />
        ))}
      </div>
    </div>
  );
}
