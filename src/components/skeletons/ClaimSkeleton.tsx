"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function ClaimSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 p-8" role="status" aria-live="polite" aria-label="Loading claim page">
      <div className="flex items-center gap-3 animate-pulse-glow" aria-hidden="true">
        <div className="skeleton-shimmer w-10 h-10 rounded-lg" />
        <SkeletonLine width="12rem" height="1.5rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
      </div>
    </div>
  );
}
