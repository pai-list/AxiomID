import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsError from "@/app/dashboard/settings/error";

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("dashboard/settings/error.tsx — SettingsError page", () => {
  it("renders the generic error title", () => {
    render(<SettingsError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a Try Again button that calls reset()", () => {
    const resetFn = jest.fn();
    render(<SettingsError error={makeError("boom")} reset={resetFn} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it("handles an error carrying a digest without crashing", () => {
    expect(() => {
      render(<SettingsError error={makeError("digest error", "digest-def")} reset={jest.fn()} />);
    }).not.toThrow();
  });
});
