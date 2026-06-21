"use client";

import { RouteErrorPage } from "@/components/RouteErrorPage";

export default function SandboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPage
      title="Sandbox Error"
      fallbackMessage="Something went wrong loading the sandbox."
      error={error}
      reset={reset}
    />
  );
}
