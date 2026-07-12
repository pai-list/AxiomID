"use client";

import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

function ErrorFallbackWrapper({ error, resetErrorBoundary }: FallbackProps) {
  const safeError = error instanceof Error ? error : null;
  return <ErrorFallback error={safeError} resetErrorBoundary={resetErrorBoundary} />;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  if (fallback) {
    return (
      <ReactErrorBoundary fallback={fallback} onReset={() => window.location.reload()}>
        {children}
      </ReactErrorBoundary>
    );
  }
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallbackWrapper} onReset={() => window.location.reload()}>
      {children}
    </ReactErrorBoundary>
  );
}
