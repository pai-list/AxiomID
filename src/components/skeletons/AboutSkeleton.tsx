"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function AboutSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6" role="status" aria-live="polite" aria-label="Loading about page">
      <div className="flex items-center gap-3 animate-pulse-glow" aria-hidden="true">
        <SkeletonCircle size="2rem" />
        <SkeletonLine width="10rem" height="1.25rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <SkeletonCard height="160px" />
          <SkeletonCard height="160px" />
          <SkeletonCard height="160px" />
        </div>
        <div className="md:col-span-7">
          <SkeletonLine width="14rem" height="1rem" className="mb-4" />
          <SkeletonCard height="400px" />
        </div>
      </div>
    </div>
  );
}
