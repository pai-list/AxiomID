"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6" role="status" aria-live="polite" aria-label="Loading settings">
      <SkeletonLine width="8rem" height="1.5rem" />
      <SkeletonCard height="200px" />
      <SkeletonCard height="150px" />
      <SkeletonCard height="300px" />
    </div>
  );
}
