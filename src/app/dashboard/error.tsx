"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPage
      title="Dashboard Error"
      fallbackMessage="Something went wrong loading the dashboard."
      error={error}
      reset={reset}
    />
  );
}
