/**
 * Content tests for
 * docs/superpowers/plans/2026-07-14-rta-phase-7-implementation.md
 *
 * PR change: new implementation plan enumerating the 11 sequential PRs for
 * RTA Phase 7 repository modernization.
 */

import fs from "fs";
import path from "path";

const planPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "docs",
  "superpowers",
  "plans",
  "2026-07-14-rta-phase-7-implementation.md"
);
const planContent = fs.readFileSync(planPath, "utf-8");

const ALL_PR_LABELS = ["K", "D", "H", "C", "A", "B", "J", "F", "E", "I", "L"];

describe("rta-phase-7-implementation.md — document structure", () => {
  it("starts with the expected title", () => {
    expect(planContent.trimStart().startsWith("# RTA Phase 7 — Repository Modernization Implementation Plan")).toBe(true);
  });

  it("is non-empty", () => {
    expect(planContent.length).toBeGreaterThan(0);
  });

  it("states the goal of executing 11 sequential PRs", () => {
    expect(planContent).toContain("**Goal:** Execute 11 sequential PRs to modernize the AxiomID repository based on RTA findings.");
  });

  it("declares the required sub-skill for agentic workers", () => {
    expect(planContent).toMatch(/REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans/);
  });

  it("documents the Global Constraints section", () => {
    expect(planContent).toContain("## Global Constraints");
    expect(planContent).toContain("One PR at a time, no parallel execution");
    expect(planContent).toContain("Branch convention: `feat/rta-phase7-<label>`");
  });

  it("ends with an Execution Order Verification section", () => {
    expect(planContent).toContain("## Execution Order Verification");
    expect(planContent).toContain("After all 11 PRs are merged, verify all items complete.");
  });
});

describe("rta-phase-7-implementation.md — task enumeration", () => {
  it("has exactly 11 numbered tasks", () => {
    const taskHeadings = planContent.match(/^### Task \d+:/gm) ?? [];
    expect(taskHeadings).toHaveLength(11);
  });

  it("numbers tasks sequentially from 1 to 11", () => {
    const taskNumbers = Array.from(planContent.matchAll(/^### Task (\d+):/gm)).map((m) => Number(m[1]));
    expect(taskNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("references every PR label exactly once as a task heading", () => {
    for (const label of ALL_PR_LABELS) {
      const matches = planContent.match(new RegExp(`^### Task \\d+: PR-${label}\\b`, "gm")) ?? [];
      expect(matches).toHaveLength(1);
    }
  });

  it("marks PR-K as blocked pending a Cloudflare zone_id", () => {
    expect(planContent).toContain("### Task 1: PR-K — Add `[[routes]]` to `backend/wrangler.toml`");
    expect(planContent).toContain("(Blocked — needs Cloudflare zone_id)");
  });

  it("marks PR-D as already done via PR #314", () => {
    expect(planContent).toContain("### Task 2: PR-D — Fix CHANGELOG SemVer Violation");
    expect(planContent).toContain("(Done — PR #314)");
  });

  it("documents PR-J archiving iqra-core/ to docs/archive/", () => {
    expect(planContent).toContain("### Task 7: PR-J — Archive `iqra-core/`");
    expect(planContent).toContain("(Move schema.sql to docs/archive/)");
  });
});

describe("rta-phase-7-implementation.md — PR-H checklist (only task with step-level checkboxes)", () => {
  it("lists exactly 6 unchecked checkbox steps for PR-H", () => {
    const checkboxes = planContent.match(/^- \[ \] Step \d+:/gm) ?? [];
    expect(checkboxes).toHaveLength(6);
  });

  it("numbers the PR-H steps sequentially from 1 to 6", () => {
    const stepNumbers = Array.from(planContent.matchAll(/^- \[ \] Step (\d+):/gm)).map((m) => Number(m[1]));
    expect(stepNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("identifies the file to modify for PR-H", () => {
    expect(planContent).toContain("- Modify: `docs/knowledge/05_dna/decision-history.md`");
  });
});