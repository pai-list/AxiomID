"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
