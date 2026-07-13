import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ClaimError from "@/app/claim/error";

jest.mock("@/app/context/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: jest.fn(),
    t: (key: string) => key,
  }),
}));

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("claim/error.tsx — ClaimError page", () => {
  it("renders the generic error title", () => {
    render(<ClaimError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a Try Again button that calls reset()", () => {
    const resetFn = jest.fn();
    render(<ClaimError error={makeError("boom")} reset={resetFn} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it("handles an error carrying a digest without crashing", () => {
    expect(() => {
      render(<ClaimError error={makeError("digest error", "digest-456")} reset={jest.fn()} />);
    }).not.toThrow();
  });

  it("renders the ErrorFallback with alert role", () => {
    render(<ClaimError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders the error message in the fallback", () => {
    render(<ClaimError error={makeError("boom")} reset={jest.fn()} />);
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });
});
