"use client";

import Link from "next/link";

interface RouteErrorPageProps {
  title: string;
  fallbackMessage: string;
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Renders a full-screen error page displaying error information and action controls.
 *
 * In development, the actual error message is displayed; in production, a fallback message is shown.
 * The error is logged to the console with the provided title.
 */
export function RouteErrorPage({ title, fallbackMessage, error, reset }: RouteErrorPageProps) {
  console.error(`${title}:`, error);
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4">
      <div className="bento-card max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white font-mono mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-6">
          {process.env.NODE_ENV === "development" ? error.message : fallbackMessage}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-xs px-4 py-2">
            RETRY
          </button>
          <Link href="/dashboard" className="btn-ghost text-xs px-4 py-2">
            BACK TO DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
}