/**
 * Tests for src/app/dashboard/sandbox/error.tsx
 *
 * PR change: new route-level error boundary page for /dashboard/sandbox,
 * wrapping the shared RouteErrorPage component with a fixed "Sandbox Error"
 * title.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SandboxError from "@/app/dashboard/sandbox/error";

import { logger } from "@/lib/logger";
const loggerSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

afterAll(() => {
  loggerSpy.mockRestore();
});

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("dashboard/sandbox/error.tsx — SandboxError page", () => {
  it("renders the 'Sandbox Error' title", () => {
    render(<SandboxError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("Sandbox Error")).toBeInTheDocument();
  });

  it("renders a RETRY button that calls reset()", () => {
    const resetFn = jest.fn();
    render(<SandboxError error={makeError("boom")} reset={resetFn} />);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it("renders a BACK TO DASHBOARD link pointing to /dashboard", () => {
    render(<SandboxError error={makeError("boom")} reset={jest.fn()} />);
    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("logs the error to logger.error with the 'Sandbox Error' title", () => {
    const error = makeError("sandbox failure");
    render(<SandboxError error={error} reset={jest.fn()} />);
    expect(loggerSpy).toHaveBeenCalledWith("Sandbox Error:", error);
  });

  it("shows the fixed fallback message instead of the raw error message in production", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });

    render(<SandboxError error={makeError("internal sandbox detail")} reset={jest.fn()} />);

    expect(screen.getByText("Something went wrong loading this page.")).toBeInTheDocument();
    expect(screen.queryByText("internal sandbox detail")).not.toBeInTheDocument();

    Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv, writable: true });
  });

  it("handles an error carrying a digest without crashing", () => {
    expect(() => {
      render(<SandboxError error={makeError("digest error", "digest-sbx-1")} reset={jest.fn()} />);
    }).not.toThrow();
  });

  it("calls reset only once per click even if clicked repeatedly is idempotent per click", () => {
    const resetFn = jest.fn();
    render(<SandboxError error={makeError("boom")} reset={resetFn} />);

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    fireEvent.click(retryBtn);

    expect(resetFn).toHaveBeenCalledTimes(2);
  });
});