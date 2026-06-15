"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

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
