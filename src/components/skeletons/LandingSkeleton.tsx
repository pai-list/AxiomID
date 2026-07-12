"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function LandingSkeleton() {
  return (
    <div className="flex flex-col gap-12 p-8" role="status" aria-live="polite" aria-label="Loading landing page">
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="animate-pulse-glow" aria-hidden="true">
          <div className="skeleton-shimmer w-16 h-16 rounded-xl" />
        </div>
        <SkeletonLine width="20rem" height="2.5rem" />
        <SkeletonLine width="30rem" height="1.25rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
      </div>
    </div>
  );
}
