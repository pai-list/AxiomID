"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled React render errors and shows a fallback UI
 * instead of a white screen of death.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bento-card max-w-md w-full p-8 text-center" style={{ border: "1px solid var(--card-border)" }}>
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Something went wrong
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary text-xs font-mono px-6 py-2.5 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
