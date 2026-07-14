/**
 * Content tests for docs/archive/README.md
 *
 * PR change: new file introduced during RTA Phase 7 repository modernization
 * (PR-J — Archive `iqra-core/`). Explains why `docs/archive/` exists and
 * documents the provenance of the archived `iqra-core-schema.sql` file.
 */

import fs from "fs";
import path from "path";

const readmePath = path.join(__dirname, "..", "..", "..", "docs", "archive", "README.md");
const readmeContent = fs.readFileSync(readmePath, "utf-8");

describe("docs/archive/README.md — document structure", () => {
  it("starts with the expected title", () => {
    expect(readmeContent.trimStart().startsWith("# Archived Files")).toBe(true);
  });

  it("explains the purpose of the archive directory", () => {
    expect(readmeContent).toContain("RTA Phase 7 repository modernization");
    expect(readmeContent).toContain("preserved for reference but not actively maintained");
  });

  it("is non-empty", () => {
    expect(readmeContent.length).toBeGreaterThan(0);
  });
});

describe("docs/archive/README.md — iqra-core-schema.sql entry", () => {
  it("has a section heading for the archived schema file", () => {
    expect(readmeContent).toContain("## `iqra-core-schema.sql`");
  });

  it("documents the origin of the file", () => {
    expect(readmeContent).toMatch(/\*\*Origin:\*\*\s*`iqra-core\/`/);
    expect(readmeContent).toContain("IQRA framework");
  });

  it("documents the date archived in ISO (YYYY-MM-DD) format", () => {
    const match = readmeContent.match(/\*\*Date archived:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe("2026-07-14");
  });

  it("documents the reason for archiving", () => {
    expect(readmeContent).toMatch(/\*\*Reason:\*\*\s*Single-file module with no active references in code or config/);
  });

  it("documents the schema format", () => {
    expect(readmeContent).toMatch(/\*\*Format:\*\*\s*SQLite \/ Cloudflare D1 schema/);
  });

  it("references a filename that matches an actual archived file on disk", () => {
    const headingMatch = readmeContent.match(/## `([^`]+)`/);
    expect(headingMatch).not.toBeNull();
    const referencedFile = headingMatch![1];
    const archivedFilePath = path.join(path.dirname(readmePath), referencedFile);
    expect(fs.existsSync(archivedFilePath)).toBe(true);
  });
});

describe("docs/archive/README.md — negative/boundary checks", () => {
  it("does not contain placeholder or unfinished-content markers", () => {
    expect(readmeContent).not.toMatch(/\bTODO\b/i);
    expect(readmeContent).not.toMatch(/\bTBD\b/i);
    expect(readmeContent).not.toMatch(/\bFIXME\b/i);
  });

  it("has exactly one archived-file section heading (single-entry archive)", () => {
    const headings = readmeContent.match(/^## `[^`]+`$/gm) ?? [];
    expect(headings).toHaveLength(1);
  });

  it("declares the date archived using a real, well-formed calendar date", () => {
    const match = readmeContent.match(/\*\*Date archived:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    const [, dateStr] = match ?? [];
    expect(dateStr).toBeDefined();
    const parsed = new Date(`${dateStr}T00:00:00Z`);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(parsed.toISOString().slice(0, 10)).toBe(dateStr);
  });
});