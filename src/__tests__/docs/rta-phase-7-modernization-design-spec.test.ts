/**
 * Content tests for
 * docs/superpowers/specs/2026-07-14-rta-phase-7-modernization-design.md
 *
 * PR change: new design spec describing the rationale, batching strategy,
 * and per-PR detail for the 11 PRs of RTA Phase 7 repository modernization.
 */

import fs from "fs";
import path from "path";

const specPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "docs",
  "superpowers",
  "specs",
  "2026-07-14-rta-phase-7-modernization-design.md"
);
const specContent = fs.readFileSync(specPath, "utf-8");

describe("rta-phase-7-modernization-design.md — document metadata", () => {
  it("starts with the expected title", () => {
    expect(specContent.trimStart().startsWith("# RTA Phase 7 — Repository Modernization Design")).toBe(true);
  });

  it("is non-empty", () => {
    expect(specContent.length).toBeGreaterThan(0);
  });

  it("declares version, date, and draft status", () => {
    expect(specContent).toMatch(/\*\*Version:\*\*\s*1\.0/);
    expect(specContent).toMatch(/\*\*Date:\*\*\s*2026-07-14/);
    expect(specContent).toMatch(/\*\*Status:\*\*\s*Draft — pending user review/);
  });
});

describe("rta-phase-7-modernization-design.md — execution strategy batching", () => {
  it("describes three sequential batches by name", () => {
    expect(specContent).toContain("### Batch 1 — Quick Wins (PRs K, D, H, C, A)");
    expect(specContent).toContain("### Batch 2 — Medium Impact (PRs B, J, F)");
    expect(specContent).toContain("### Batch 3 — Major Work (PRs E, I, L)");
  });

  it("declares the sequencing order: quick wins, then medium impact, then major work", () => {
    expect(specContent).toContain("**Sequence:** Quick wins first → Medium impact → Major work");

    const batch1Index = specContent.indexOf("### Batch 1");
    const batch2Index = specContent.indexOf("### Batch 2");
    const batch3Index = specContent.indexOf("### Batch 3");
    expect(batch1Index).toBeGreaterThan(-1);
    expect(batch2Index).toBeGreaterThan(batch1Index);
    expect(batch3Index).toBeGreaterThan(batch2Index);
  });

  it("has an Order column that runs 1 through 11 across all three batch tables", () => {
    const orderNumbers = Array.from(specContent.matchAll(/^\| (\d+) \| PR-\w+ \|/gm)).map((m) => Number(m[1]));
    expect(orderNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe("rta-phase-7-modernization-design.md — per-PR detail sections (3.1–3.11)", () => {
  const expectedSections: Array<[string, string]> = [
    ["3.1", "PR-K: Add `[[routes]]` to `wrangler.toml`"],
    ["3.2", "PR-D: Fix CHANGELOG SemVer Violation"],
    ["3.3", "PR-H: Add `decision-history.md` Entries"],
    ["3.4", "PR-C: Clean Repository Root"],
    ["3.5", "PR-A: `.gitignore` Cleanup"],
    ["3.6", "PR-B: Rename `.superpowers/` → `.ai/`"],
    ["3.7", "PR-J: Archive `iqra-core/`"],
    ["3.8", "PR-F: Expand `CONTRIBUTING.md`"],
    ["3.9", "PR-E: Introduce npm Workspaces for `packages/`"],
    ["3.10", "PR-I: OpenAPI Spec for 20+ API Routes"],
    ["3.11", "PR-L: Create `AxiomID.Memory/reference/` Standards Directory"],
  ];

  it.each(expectedSections)("has a section heading for %s %s", (number, title) => {
    expect(specContent).toContain(`### ${number} ${title}`);
  });

  it("documents the PR-J archive change with the correct source and destination paths", () => {
    expect(specContent).toContain(
      "**Change:** Move `iqra-core/schema.sql` to `docs/archive/iqra-core-schema.sql` with a README explaining its origin. Delete the empty `iqra-core/` directory."
    );
  });
});

describe("rta-phase-7-modernization-design.md — success criteria checklist", () => {
  it("lists exactly 12 unchecked success criteria", () => {
    const checkboxes = specContent.match(/^- \[ \] /gm) ?? [];
    expect(checkboxes).toHaveLength(12);
  });

  it("includes the criterion for all 11 PRs being merged", () => {
    expect(specContent).toContain("- [ ] All 11 PRs merged to `main`");
  });

  it("includes the criterion for the AxiomID.Memory/reference/ directory", () => {
    expect(specContent).toContain("- [ ] `AxiomID.Memory/reference/` directory exists with standards summaries");
  });
});