/**
 * @jest-environment node
 *
 * Structural tests for public/llms.txt.
 *
 * This PR rewrote llms.txt from a detailed reference document (DID scheme,
 * trust score formula, API endpoint list, tech stack, links) into a shorter
 * "agent interaction guidelines" style document focused on Web3/AI framing
 * and trust score thresholds. These tests validate the new content is
 * present and that stale information from the previous revision (old
 * did:axiom:pi:{uid} scheme, /api/passport/{username} etc.) is not
 * reintroduced by accident.
 */

import fs from "fs";
import path from "path";

const LLMS_TXT_PATH = path.join(__dirname, "../../../public/llms.txt");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(LLMS_TXT_PATH)) {
    return;
  }
  content = fs.readFileSync(LLMS_TXT_PATH, "utf-8");
});

describe("public/llms.txt — file existence", () => {
  it("exists in the public directory", () => {
    expect(fs.existsSync(LLMS_TXT_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("starts with the '# AxiomID' top-level heading", () => {
    expect(content.trimStart()).toMatch(/^# AxiomID/);
  });

  it("has a blockquote tagline describing the Human Authorization Protocol", () => {
    expect(content).toContain("> The Human Authorization Protocol");
  });
});

describe("public/llms.txt — required sections", () => {
  const requiredSections = [
    "## Core Features",
    "## Web3 & AI Integration",
    "## Interaction Guidelines for Agents",
  ];

  it.each(requiredSections)("contains section '%s'", (section) => {
    expect(content).toContain(section);
  });

  it("contains exactly 3 H2 sections", () => {
    const h2Headings = content.match(/^## .+/gm) ?? [];
    expect(h2Headings).toHaveLength(3);
  });
});

describe("public/llms.txt — core features", () => {
  it("mentions Sovereign Passports", () => {
    expect(content).toMatch(/\*\*Sovereign Passports:\*\*/);
  });

  it("mentions KYC & KYA (Know Your Agent)", () => {
    expect(content).toMatch(/KYC & KYA \(Know Your Agent\)/);
  });

  it("references the W3C-compliant DID format did:ax:xxx", () => {
    expect(content).toContain("`did:ax:xxx`");
  });

  it("mentions Agentic Trust Scores for Sybil/bot resistance", () => {
    expect(content).toMatch(/Agentic Trust Scores/);
    expect(content).toMatch(/bot\/Sybil attacks/);
  });
});

describe("public/llms.txt — web3 & AI integration", () => {
  it("references the Pi Network for consensus/onboarding", () => {
    expect(content).toContain("Pi Network for consensus and user onboarding");
  });

  it("mentions the PiNet iframe sandbox and Pi SDK", () => {
    expect(content).toContain("PiNet sandbox");
    expect(content).toContain("Pi SDK");
  });

  it("mentions the programmatic did/trustScores/kycStatus fields", () => {
    expect(content).toContain("`did`");
    expect(content).toContain("`trustScores`");
    expect(content).toContain("`kycStatus`");
  });
});

describe("public/llms.txt — interaction guidelines for agents", () => {
  it("directs agents to the DID document endpoint", () => {
    expect(content).toContain("`/api/did/:id`");
  });

  it("defines the EXCELLENT trust score threshold as >= 80", () => {
    expect(content).toMatch(/>=\s*80\s*\(EXCELLENT\)/);
  });

  it("defines the GOOD trust score threshold as >= 60", () => {
    expect(content).toMatch(/>=\s*60\s*\(GOOD\)/);
  });

  it("defines the FAIR trust score threshold as >= 40", () => {
    expect(content).toMatch(/>=\s*40\s*\(FAIR\)/);
  });

  it("describes the Glassmorphism cyberpunk dark-mode design", () => {
    expect(content).toContain("Glassmorphism");
    expect(content).toContain("OLED Black #10131a");
  });
});

describe("public/llms.txt — regression: stale content from the previous revision is removed", () => {
  it("no longer documents the did:axiom:pi:{uid} identifier scheme", () => {
    expect(content).not.toContain("did:axiom:pi:{uid}");
  });

  it("no longer documents the Trust Tiers table", () => {
    expect(content).not.toContain("## Trust Tiers");
  });

  it("no longer lists the old public API Endpoints section", () => {
    expect(content).not.toContain("## API Endpoints");
    expect(content).not.toContain("/api/passport/{username}");
    expect(content).not.toContain("/api/did-document");
  });

  it("no longer lists the Tech Stack section", () => {
    expect(content).not.toContain("## Tech Stack");
  });

  it("no longer includes the GitHub/claim/website Links section", () => {
    expect(content).not.toContain("## Links");
    expect(content).not.toContain("github.com/Moeabdelaziz007");
  });

  it("no longer includes the 'Built By' attribution section", () => {
    expect(content).not.toContain("## Built By");
  });
});