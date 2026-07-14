/**
 * @jest-environment node
 *
 * Structural tests for CONTRIBUTING.md.
 *
 * CONTRIBUTING.md was substantially rewritten in this PR (expanded Quick Start,
 * Prerequisites, Project Structure, Development Workflow, Testing, i18n, and Pi SDK
 * sections). These tests validate that the required sections, commands, and
 * references exist and that stale/removed content does not reappear. They guard
 * against accidental content removal or edits that would mislead contributors.
 */

import fs from "fs";
import path from "path";

const CONTRIBUTING_MD_PATH = path.join(__dirname, "../../CONTRIBUTING.md");
const CODE_OF_CONDUCT_MD_PATH = path.join(__dirname, "../../CODE_OF_CONDUCT.md");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(CONTRIBUTING_MD_PATH)) {
    return;
  }
  content = fs.readFileSync(CONTRIBUTING_MD_PATH, "utf-8");
});

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — file existence", () => {
  it("exists at the repository root", () => {
    expect(fs.existsSync(CONTRIBUTING_MD_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("starts with a top-level heading", () => {
    expect(content.trimStart()).toMatch(/^# Contributing to AxiomID/);
  });

  it("ends with a newline character", () => {
    expect(content).toMatch(/\n$/);
  });
});

// ---------------------------------------------------------------------------
// Required sections
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — required sections", () => {
  const requiredSections = [
    "## Quick Start",
    "## Prerequisites",
    "## Project Structure",
    "## Development Workflow",
    "## Testing",
    "## Internationalization (i18n)",
    "## Pi SDK Guidelines",
    "## Code of Conduct",
    "## Questions?",
  ];

  it.each(requiredSections)("contains section '%s'", (section) => {
    expect(content).toContain(section);
  });

  const requiredSubsections = [
    "### Branch Naming",
    "### Commit Format (IQRA Chronicle)",
    "### Before Every Push",
    "### PR Process",
  ];

  it.each(requiredSubsections)("contains subsection '%s'", (subsection) => {
    expect(content).toContain(subsection);
  });
});

// ---------------------------------------------------------------------------
// Quick Start
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Quick Start", () => {
  it("references the correct repository clone URL", () => {
    expect(content).toContain(
      "git clone https://github.com/Moeabdelaziz007/AxiomID.git",
    );
  });

  it("instructs contributors to copy the env example file", () => {
    expect(content).toContain("cp .env.example .env.local");
  });

  it("instructs contributors to install dependencies with npm install", () => {
    expect(content).toContain("npm install");
  });

  it("instructs contributors to generate the Prisma client", () => {
    expect(content).toContain("npx prisma generate");
  });

  it("instructs contributors to start the dev server", () => {
    expect(content).toContain("npm run dev");
  });

  it("links to the local dev server URL", () => {
    expect(content).toContain("http://localhost:3000");
  });

  it("wraps the Quick Start steps in a bash code block", () => {
    const quickStartSection = content.split("## Quick Start")[1]?.split("## Prerequisites")[0] ?? "";
    expect(quickStartSection).toMatch(/```bash[\s\S]*```/);
  });
});

// ---------------------------------------------------------------------------
// Prerequisites
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Prerequisites", () => {
  it("requires Node.js 20+", () => {
    expect(content).toMatch(/Node\.js 20\+/);
  });

  it("requires npm 10+", () => {
    expect(content).toMatch(/npm 10\+/);
  });

  it("recommends Git with signed commits", () => {
    expect(content).toMatch(/Git.*signed commits/);
  });

  it("mentions Pi Browser for testing Pi Network features", () => {
    expect(content).toContain("Pi Browser");
  });

  it("mentions the optional Portless tool for stable HTTPS URLs", () => {
    expect(content).toContain("Portless");
    expect(content).toContain("npm install -g portless");
  });
});

// ---------------------------------------------------------------------------
// Project Structure
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Project Structure", () => {
  const structureEntries = [
    "src/",
    "app/",
    "components/",
    "lib/",
    "i18n/",
    "diagnostics/",
    "types/",
    "packages/",
    "crypto/",
    "sdk/",
    "backend/",
    "prisma/",
    "docs/",
    ".ai/",
  ];

  it.each(structureEntries)("lists the '%s' directory", (entry) => {
    const structureSection =
      content.split("## Project Structure")[1]?.split("## Development Workflow")[0] ?? "";
    expect(structureSection).toContain(entry);
  });

  it("describes packages/crypto as @axiomid/crypto (Ed25519 keys)", () => {
    expect(content).toContain("@axiomid/crypto");
    expect(content).toContain("Ed25519 keys");
  });

  it("describes packages/sdk as @axiomid/sdk (public API client)", () => {
    expect(content).toContain("@axiomid/sdk");
    expect(content).toContain("public API client");
  });

  it("describes backend/ as Cloudflare Workers", () => {
    expect(content).toMatch(/backend\/\s*— Cloudflare Workers/);
  });
});

// ---------------------------------------------------------------------------
// Development Workflow — Branch Naming
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Branch Naming", () => {
  const branchPrefixes = ["feat/", "fix/", "refactor/", "docs/", "chore/"];

  it.each(branchPrefixes)("documents the '%s' branch prefix", (prefix) => {
    const branchSection =
      content.split("### Branch Naming")[1]?.split("### Commit Format")[0] ?? "";
    expect(branchSection).toContain(prefix);
  });
});

// ---------------------------------------------------------------------------
// Development Workflow — Commit Format
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Commit Format (IQRA Chronicle)", () => {
  it("documents the conventional commit type/scope/description structure", () => {
    expect(content).toContain("type(scope): short description");
  });

  it("includes the IQRA Chronicle glyph in the commit template", () => {
    const commitSection =
      content.split("### Commit Format (IQRA Chronicle)")[1]?.split("### Before Every Push")[0] ?? "";
    expect(commitSection).toContain("۞");
  });

  const commitTypes = [
    "feat",
    "fix",
    "refactor",
    "docs",
    "chore",
    "test",
    "perf",
    "style",
  ];

  it.each(commitTypes)("lists the commit type '%s'", (type) => {
    const commitSection =
      content.split("### Commit Format (IQRA Chronicle)")[1]?.split("### Before Every Push")[0] ?? "";
    expect(commitSection).toMatch(new RegExp("`" + type + "`"));
  });
});

// ---------------------------------------------------------------------------
// Development Workflow — Before Every Push
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Before Every Push checklist", () => {
  const requiredCommands = [
    "npm run lint",
    "npm run type-check",
    "npm test",
    "npm run build",
  ];

  it.each(requiredCommands)("requires running '%s' before pushing", (command) => {
    const beforePushSection =
      content.split("### Before Every Push")[1]?.split("### PR Process")[0] ?? "";
    expect(beforePushSection).toContain(command);
  });
});

// ---------------------------------------------------------------------------
// Development Workflow — PR Process
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — PR Process", () => {
  it("describes a 7-step ordered PR process", () => {
    const prSection = content.split("### PR Process")[1]?.split("## Testing")[0] ?? "";
    const orderedSteps = prSection.match(/^\d+\. .+/gm) ?? [];
    expect(orderedSteps).toHaveLength(7);
  });

  it("requires branching from main", () => {
    expect(content).toMatch(/Create branch from `main`/);
  });

  it("requires CI to pass across Vercel, GitHub Actions, CodeQL, and CodeRabbit", () => {
    expect(content).toContain("CI must pass (Vercel, GitHub Actions, CodeQL, CodeRabbit)");
  });

  it("requires squash merging to main", () => {
    expect(content).toMatch(/Squash merge to `main`/);
  });
});

// ---------------------------------------------------------------------------
// Testing section
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Testing", () => {
  const testCommands = ["npm test", "npm test -- --watch", "npm test -- --coverage"];

  it.each(testCommands)("documents the test command '%s'", (command) => {
    const testingSection =
      content.split("## Testing")[1]?.split("## Internationalization")[0] ?? "";
    expect(testingSection).toContain(command);
  });

  it("directs contributors to follow existing patterns in src/__tests__/", () => {
    expect(content).toContain("src/__tests__/");
  });
});

// ---------------------------------------------------------------------------
// Internationalization (i18n) section
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Internationalization (i18n)", () => {
  it("requires translation keys in both en.json and ar.json", () => {
    expect(content).toContain("src/i18n/en.json");
    expect(content).toContain("src/i18n/ar.json");
  });

  it("documents the useLanguage() hook usage", () => {
    expect(content).toContain("useLanguage()");
  });

  it("documents the bilingual helper pattern for custom components", () => {
    expect(content).toContain(
      "const t = (en: string, ar: string) => language === 'en' ? en : ar",
    );
  });

  it("the referenced i18n translation files actually exist", () => {
    const enPath = path.join(__dirname, "../i18n/en.json");
    const arPath = path.join(__dirname, "../i18n/ar.json");
    expect(fs.existsSync(enPath)).toBe(true);
    expect(fs.existsSync(arPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pi SDK Guidelines
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Pi SDK Guidelines", () => {
  it("warns that the Pi SDK is browser-only", () => {
    expect(content).toMatch(/Pi SDK is browser-only/);
  });

  it("prohibits importing the Pi SDK in Server Components or API routes", () => {
    expect(content).toMatch(/never import in Server Components or API routes/);
  });

  it("requires sandbox mode to be determined dynamically via determineSandboxMode()", () => {
    expect(content).toContain("determineSandboxMode()");
    expect(content).toMatch(/never hardcode/);
  });

  it("recommends testing Pi features in Pi Browser with sandbox mode enabled", () => {
    expect(content).toMatch(/Test Pi features in Pi Browser with sandbox mode enabled/);
  });
});

// ---------------------------------------------------------------------------
// Code of Conduct
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Code of Conduct", () => {
  it("links to CODE_OF_CONDUCT.md", () => {
    expect(content).toContain("[Code of Conduct](CODE_OF_CONDUCT.md)");
  });

  it("the referenced CODE_OF_CONDUCT.md file actually exists in the repo root", () => {
    expect(fs.existsSync(CODE_OF_CONDUCT_MD_PATH)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Questions section
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — Questions", () => {
  it("links to the GitHub Discussions page", () => {
    expect(content).toContain(
      "[GitHub Discussion](https://github.com/Moeabdelaziz007/AxiomID/discussions)",
    );
  });
});

// ---------------------------------------------------------------------------
// Boundary / negative cases — stale content should not reappear
// ---------------------------------------------------------------------------

describe("CONTRIBUTING.md — boundary and negative cases", () => {
  it("does not contain the old, shorter Quick Start numbered-list instructions", () => {
    expect(content).not.toMatch(/1\. Fork the repo/);
    expect(content).not.toContain("npm ci");
  });

  it("does not reference the removed external docs page as the architecture overview", () => {
    expect(content).not.toContain("https://axiomid.app/docs");
    expect(content).not.toContain("## Architecture");
  });

  it("does not contain the old one-line Code of Conduct summary without a link", () => {
    expect(content).not.toContain(
      "Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org).",
    );
  });

  it("does not contain unresolved merge-conflict markers", () => {
    expect(content).not.toMatch(/^(<{7}|={7}|>{7})/m);
  });

  it("does not contain hardcoded secrets or API keys (no Bearer token patterns)", () => {
    expect(content).not.toMatch(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/);
  });

  it("contains exactly one top-level H1 heading", () => {
    const h1Headings = content.match(/^# .+/gm) ?? [];
    expect(h1Headings).toHaveLength(1);
  });
});