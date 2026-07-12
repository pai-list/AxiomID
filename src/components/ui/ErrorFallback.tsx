"use client";

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, title, message }: ErrorFallbackProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-deep flex items-center justify-center">
        <span className="text-warning text-2xl font-bold">!</span>
      </div>
      <h2 className="text-surface text-xl font-semibold">{title || "Something went wrong"}</h2>
      <p className="text-subtle max-w-md">{message || "An unexpected error occurred. Please try again."}</p>
      {process.env.NODE_ENV === "development" && error && (
        <pre className="text-faint text-xs max-w-md overflow-auto p-3 bg-surface-deep rounded-lg">
          {error.message}{error.stack && `\n\n${error.stack}`}
        </pre>
      )}
      {resetErrorBoundary && (
        <button onClick={resetErrorBoundary} className="btn-primary px-6 py-2 rounded-lg">
          Try Again
        </button>
      )}
    </div>
  );
}
