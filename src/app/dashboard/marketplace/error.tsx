"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

/**
 * Error boundary component for the marketplace dashboard route.
 */
export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPage
      title="Marketplace Error"
      fallbackMessage="Something went wrong loading the marketplace."
      error={error}
      reset={reset}
    />
  );
}
