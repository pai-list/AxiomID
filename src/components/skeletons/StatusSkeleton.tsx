"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function StatusSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading status page">
      <SkeletonLine width="12rem" height="1.5rem" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height="160px" />
        ))}
      </div>
    </div>
  );
}
