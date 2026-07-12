import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AboutError from "@/app/about/error";

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("about/error.tsx — AboutError page", () => {
  it("renders the generic error title", () => {
    render(<AboutError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a Try Again button that calls reset()", () => {
    const resetFn = jest.fn();
    render(<AboutError error={makeError("boom")} reset={resetFn} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it("handles an error carrying a digest without crashing", () => {
    expect(() => {
      render(<AboutError error={makeError("digest error", "digest-123")} reset={jest.fn()} />);
    }).not.toThrow();
  });
});
