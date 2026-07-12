"use client";

import { SkeletonLine, SkeletonCircle, SkeletonCard } from "@/components/ui/skeleton";

export function PassportSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 p-8" role="status" aria-live="polite" aria-label="Loading passport">
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <SkeletonCircle size="5rem" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonLine width="60%" height="1.5rem" />
          <SkeletonLine width="40%" height="1rem" />
          <SkeletonLine width="30%" height="0.875rem" />
        </div>
      </div>
      <SkeletonCard height="300px" className="max-w-2xl" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        <SkeletonCard height="150px" />
        <SkeletonCard height="150px" />
      </div>
    </div>
  );
}
