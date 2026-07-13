"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function DocsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading documentation">
      <div className="flex items-center gap-3 animate-pulse-glow" aria-hidden="true">
        <SkeletonLine width="10rem" height="1.25rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-3 space-y-2">
          <SkeletonLine width="6rem" height="0.75rem" className="mb-4" />
          <SkeletonLine width="100%" height="2.5rem" className="rounded-xl mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} width="100%" height="2.75rem" className="rounded-xl" />
          ))}
        </div>
        <div className="md:col-span-9">
          <SkeletonCard height="500px" />
        </div>
      </div>
    </div>
  );
}
