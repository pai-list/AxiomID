/**
 * Cross-document consistency tests for the RTA Phase 7 pair of new documents:
 *  - docs/superpowers/plans/2026-07-14-rta-phase-7-implementation.md
 *  - docs/superpowers/specs/2026-07-14-rta-phase-7-modernization-design.md
 *
 * PR change: both documents were added together and must stay in lockstep —
 * every PR label enumerated in the implementation plan must also appear in
 * the design spec's batch tables and per-PR detail sections, and the PR-J
 * archival step (schema.sql -> docs/archive/) must be consistent with the
 * files actually added/moved by this PR.
 */

import fs from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "..", "..", "..");
const planPath = path.join(repoRoot, "docs", "superpowers", "plans", "2026-07-14-rta-phase-7-implementation.md");
const specPath = path.join(repoRoot, "docs", "superpowers", "specs", "2026-07-14-rta-phase-7-modernization-design.md");
const archiveReadmePath = path.join(repoRoot, "docs", "archive", "README.md");
const archiveSchemaPath = path.join(repoRoot, "docs", "archive", "iqra-core-schema.sql");

const planContent = fs.readFileSync(planPath, "utf-8");
const specContent = fs.readFileSync(specPath, "utf-8");

const ALL_PR_LABELS = ["K", "D", "H", "C", "A", "B", "J", "F", "E", "I", "L"];

describe("RTA Phase 7 plan <-> spec consistency", () => {
  it("every PR label in the plan also appears in the spec's batch tables", () => {
    for (const label of ALL_PR_LABELS) {
      expect(planContent).toMatch(new RegExp(`PR-${label}\\b`));
      expect(specContent).toMatch(new RegExp(`\\| PR-${label} \\|`));
    }
  });

  it("every PR label in the spec's per-PR detail sections also appears as a task in the plan", () => {
    for (const label of ALL_PR_LABELS) {
      expect(specContent).toMatch(new RegExp(`### 3\\.\\d+ PR-${label}:`));
      expect(planContent).toMatch(new RegExp(`### Task \\d+: PR-${label} —`));
    }
  });

  it("both documents agree the total PR count is 11", () => {
    expect(planContent).toContain("Execute 11 sequential PRs");
    expect(planContent).toContain("After all 11 PRs are merged");
    expect(specContent).toContain("All 11 PRs merged to `main`");
  });

  it("both documents describe PR-J the same way: archiving iqra-core/ into docs/archive/", () => {
    expect(planContent).toContain("Archive `iqra-core/`");
    expect(planContent).toContain("Move schema.sql to docs/archive/");
    expect(specContent).toContain("### 3.7 PR-J: Archive `iqra-core/`");
    expect(specContent).toContain("Move `iqra-core/schema.sql` to `docs/archive/iqra-core-schema.sql`");
  });
});

describe("RTA Phase 7 PR-J archival is fully realized on disk", () => {
  it("the archive directory contains both the README and the archived schema", () => {
    expect(fs.existsSync(archiveReadmePath)).toBe(true);
    expect(fs.existsSync(archiveSchemaPath)).toBe(true);
  });

  it("the old iqra-core/ source directory described in the plan/spec no longer exists", () => {
    expect(fs.existsSync(path.join(repoRoot, "iqra-core"))).toBe(false);
  });

  it("the archive README's documented filename matches the actual archived schema filename", () => {
    const archiveReadmeContent = fs.readFileSync(archiveReadmePath, "utf-8");
    expect(archiveReadmeContent).toContain(path.basename(archiveSchemaPath));
  });
});

describe("RTA Phase 7 plan <-> spec consistency — negative/boundary checks", () => {
  it("the plan does not reference any PR label outside the known set of 11", () => {
    const foundLabels = new Set(Array.from(planContent.matchAll(/PR-(\w+)\b/g)).map((m) => m[1]));
    for (const label of foundLabels) {
      expect(ALL_PR_LABELS).toContain(label);
    }
  });

  it("the spec does not reference any PR label outside the known set of 11", () => {
    const foundLabels = new Set(Array.from(specContent.matchAll(/PR-(\w+)\b/g)).map((m) => m[1]));
    for (const label of foundLabels) {
      expect(ALL_PR_LABELS).toContain(label);
    }
  });

  it("ALL_PR_LABELS itself has no duplicate entries and covers exactly 11 labels", () => {
    expect(ALL_PR_LABELS).toHaveLength(11);
    expect(new Set(ALL_PR_LABELS).size).toBe(11);
  });
});