/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import PassportKeyManager from "@/components/ui/PassportKeyManager";

describe("PassportKeyManager", () => {
  const mockProps = {
    did: "did:axiom:axiomid.app:pi:abc123",
    onSign: jest.fn(),
  };

  it("renders DID display", () => {
    render(<PassportKeyManager {...mockProps} />);
    expect(screen.getByText(/did:axiom:axiom\.\.\.pp:pi:abc123/)).toBeDefined();
  });

  it("renders copy button", () => {
    render(<PassportKeyManager {...mockProps} />);
    expect(screen.getByText(/Copy DID/)).toBeDefined();
  });

  it("renders sign section", () => {
    render(<PassportKeyManager {...mockProps} />);
    expect(screen.getByText(/Sign with DID key/)).toBeDefined();
  });
});
