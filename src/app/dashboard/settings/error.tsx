"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

/**
 * Displays an error page for settings route failures.
 */
export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPage
      title="Settings Error"
      fallbackMessage="Something went wrong loading settings."
      error={error}
      reset={reset}
    />
  );
}
