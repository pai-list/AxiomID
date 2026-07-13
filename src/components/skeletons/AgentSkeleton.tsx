"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function AgentSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading agent profile">
      <div className="flex items-center gap-3 animate-pulse-glow" aria-hidden="true">
        <SkeletonCircle size="3rem" />
        <SkeletonLine width="12rem" height="1.5rem" />
      </div>
      <div className="flex items-center gap-4 p-6">
        <SkeletonCircle size="4rem" />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="10rem" height="1.25rem" />
          <SkeletonLine width="6rem" height="0.875rem" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard height="100px" />
        <SkeletonCard height="100px" />
      </div>
      <SkeletonCard height="120px" />
      <SkeletonCard height="120px" />
    </div>
  );
}
