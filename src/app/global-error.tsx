"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorFallback error={error} resetErrorBoundary={reset} />
      </body>
    </html>
  );
}
