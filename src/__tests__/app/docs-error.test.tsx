import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DocsError from "@/app/docs/error";

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("docs/error.tsx — DocsError page", () => {
  it("renders the generic error title", () => {
    render(<DocsError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a Try Again button that calls reset()", () => {
    const resetFn = jest.fn();
    render(<DocsError error={makeError("boom")} reset={resetFn} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it("handles an error carrying a digest without crashing", () => {
    expect(() => {
      render(<DocsError error={makeError("digest error", "digest-ghi")} reset={jest.fn()} />);
    }).not.toThrow();
  });
});
