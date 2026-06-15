"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

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
