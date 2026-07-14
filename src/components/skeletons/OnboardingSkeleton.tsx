"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function OnboardingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-2xl mx-auto" role="status" aria-live="polite" aria-label="Loading onboarding">
      <div className="animate-pulse-glow" aria-hidden="true">
        <div className="skeleton-shimmer w-12 h-12 rounded-lg" />
      </div>
      <SkeletonLine width="60%" height="2rem" />
      <SkeletonLine width="80%" height="1.25rem" />
      <div className="flex gap-4 w-full">
        <SkeletonCard height="300px" className="flex-1" />
        <SkeletonCard height="300px" className="flex-1" />
      </div>
      <div className="flex gap-4">
        <SkeletonLine width="8rem" height="3rem" className="rounded-lg" />
        <SkeletonLine width="8rem" height="3rem" className="rounded-lg" />
      </div>
    </div>
  );
}
