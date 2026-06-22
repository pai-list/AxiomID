"use client";

import * as Sentry from "@sentry/nextjs";

/**
 * Renders a full-page error interface when AxiomID fails to initialize.
 *
 * Displays error information appropriate for the current environment, with a retry button to attempt recovery.
 * Must include <html>/<body> tags because it replaces the entire document.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  Sentry.captureException(error);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <style>{`
          .global-error-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: #09090b;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .global-error-card {
            max-width: 28rem;
            width: 100%;
            padding: 2rem;
            text-align: center;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 1rem;
            backdrop-filter: blur(12px);
          }
          .global-error-icon {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 1rem;
            background: rgba(239,68,68,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
          }
          .global-error-icon svg { width: 1.75rem; height: 1.75rem; color: #f87171; }
          .global-error-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #fafafa;
            margin: 0 0 0.5rem;
          }
          .global-error-message {
            font-size: 0.8rem;
            color: #a1a1aa;
            margin: 0 0 1.5rem;
            white-space: pre-wrap;
          }
          .global-error-actions { display: flex; gap: 0.75rem; justify-content: center; }
          .global-error-btn {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
          }
          .global-error-btn-primary {
            background: #22c55e;
            color: #fff;
          }
          .global-error-btn-primary:hover { background: #16a34a; }
          .global-error-btn-ghost {
            background: transparent;
            color: #a1a1aa;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .global-error-btn-ghost:hover { background: rgba(255,255,255,0.05); }
          .global-error-btn:focus-visible {
            outline: 2px solid #22c55e;
            outline-offset: 2px;
          }
        `}</style>
        <div className="global-error-root">
          <div className="global-error-card">
            <div className="global-error-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="global-error-title">AxiomID failed to initialize</h1>
            <p className="global-error-message">
              {process.env.NODE_ENV === "development"
                ? error.stack
                : `Something went wrong. Contact support with code: ${error.digest ?? "unknown"}`}
            </p>
            <div className="global-error-actions">
              <button className="global-error-btn global-error-btn-primary" onClick={reset}>
                RETRY
              </button>
              <button
                className="global-error-btn global-error-btn-ghost"
                onClick={() => { window.location.href = "/"; }}
              >
                GO HOME
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
