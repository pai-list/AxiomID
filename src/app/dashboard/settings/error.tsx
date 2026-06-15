"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

/**
 * Renders a settings-specific error page for route failures.
 *
 * @returns The error page component.
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
