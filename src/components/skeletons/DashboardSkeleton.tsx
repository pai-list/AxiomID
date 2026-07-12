"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="4rem" />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="12rem" height="1.25rem" />
          <SkeletonLine width="8rem" height="0.875rem" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard height="120px" />
        <SkeletonCard height="120px" />
        <SkeletonCard height="120px" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
      </div>
      <SkeletonCard height="400px" />
    </div>
  );
}
