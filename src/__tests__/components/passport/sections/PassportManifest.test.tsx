import React from "react";
import { render, screen } from "@testing-library/react";
import { PassportManifest } from "@/components/passport/sections/PassportManifest";

// Relies on the global useLanguage mock registered in jest.setup.js, which
// returns the translation key itself for keys not present in its mock
// dictionary (kya_manifest, manifest_principal, pi_network, yes, no, etc.
// fall back to the raw key string).

describe("PassportManifest — principal and network", () => {
  it("renders the username as the manifest principal", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("renders the Pi Network label", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    expect(screen.getByText("pi_network")).toBeInTheDocument();
  });

  it("renders the AxiomID license identifier", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    expect(screen.getByText("AxiomID v1")).toBeInTheDocument();
  });

  it("renders the kya_manifest section header", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    expect(screen.getByText("kya_manifest")).toBeInTheDocument();
  });
});

describe("PassportManifest — kyc_bound status", () => {
  it("shows 'yes' with success styling when kycStatus is 'verified'", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    const yesEl = screen.getByText("yes");
    expect(yesEl).toBeInTheDocument();
    expect(yesEl).toHaveClass("text-neon-green");
  });

  it("shows 'no' without success styling when kycStatus is 'pending'", () => {
    render(<PassportManifest username="testuser" kycStatus="pending" />);
    const noEl = screen.getByText("no");
    expect(noEl).toBeInTheDocument();
    expect(noEl).not.toHaveClass("text-neon-green");
  });

  it("shows 'no' without success styling when kycStatus is 'denied'", () => {
    render(<PassportManifest username="testuser" kycStatus="denied" />);
    expect(screen.getByText("no")).toBeInTheDocument();
  });
});

describe("PassportManifest — styling", () => {
  it("wraps the manifest in the bento-card-2026/glass-card container", () => {
    const { container } = render(<PassportManifest username="testuser" kycStatus="verified" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("bento-card-2026");
    expect(root).toHaveClass("glass-card");
    expect(root).toHaveClass("rounded-xl");
  });

  it("renders manifest field labels with the muted text token class", () => {
    render(<PassportManifest username="testuser" kycStatus="verified" />);
    // getByText normalizes (trims) whitespace, so the trailing space in the
    // component's `{t('manifest_principal')} ` text node is stripped.
    const principalLabel = screen.getByText("manifest_principal");
    expect(principalLabel).toHaveClass("text-text-muted");
  });
});

describe("PassportManifest — boundary and negative cases", () => {
  it("renders correctly with an empty username", () => {
    render(<PassportManifest username="" kycStatus="verified" />);
    // manifest_network label should still render even if username is empty
    expect(screen.getByText("pi_network")).toBeInTheDocument();
  });

  it("does not render a 'yes' answer for a non-verified status", () => {
    render(<PassportManifest username="testuser" kycStatus="pending" />);
    expect(screen.queryByText("yes")).not.toBeInTheDocument();
  });
});