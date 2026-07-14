/**
 * Content tests for docs/archive/iqra-core-schema.sql
 *
 * PR change: `iqra-core/schema.sql` was moved (git mv) to
 * `docs/archive/iqra-core-schema.sql` as part of RTA Phase 7 (PR-J — Archive
 * `iqra-core/`). The file content itself is unchanged by the move, but the
 * move is a repository-structure change worth locking down with tests:
 * the schema must still be present, intact, and syntactically well-formed
 * at its new location, and the old location must no longer exist.
 */

import fs from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "..", "..", "..");
const schemaPath = path.join(repoRoot, "docs", "archive", "iqra-core-schema.sql");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");

/** Extracts top-level CREATE TABLE/INDEX statement bodies for structural checks. */
function extractStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

describe("docs/archive/iqra-core-schema.sql — file location (PR-J archive move)", () => {
  it("exists at the new archived location", () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("no longer exists at the old iqra-core/ location", () => {
    expect(fs.existsSync(path.join(repoRoot, "iqra-core", "schema.sql"))).toBe(false);
  });

  it("the old iqra-core/ directory no longer exists", () => {
    expect(fs.existsSync(path.join(repoRoot, "iqra-core"))).toBe(false);
  });

  it("is non-empty", () => {
    expect(schemaContent.length).toBeGreaterThan(0);
  });
});

describe("docs/archive/iqra-core-schema.sql — schema content", () => {
  it("retains the original file header comment describing its purpose", () => {
    expect(schemaContent).toContain("-- iqra-core/schema.sql");
    expect(schemaContent).toContain("Truth verses storage for D1 + Vectorize RAG pipeline");
  });

  it("defines the truth_chapters table with expected columns", () => {
    expect(schemaContent).toMatch(/CREATE TABLE IF NOT EXISTS truth_chapters\s*\(/);
    for (const column of ["id INTEGER PRIMARY KEY", "name_ar TEXT NOT NULL", "name_en TEXT NOT NULL", "ayat_count INTEGER NOT NULL", "revelation_type TEXT NOT NULL"]) {
      expect(schemaContent).toContain(column);
    }
  });

  it("defines the truth_verses table with a foreign key to truth_chapters", () => {
    expect(schemaContent).toMatch(/CREATE TABLE IF NOT EXISTS truth_verses\s*\(/);
    expect(schemaContent).toContain("FOREIGN KEY (chapter_id) REFERENCES truth_chapters(id)");
    expect(schemaContent).toContain("UNIQUE(chapter_id, verse_number)");
  });

  it("defines indexes for chapter and section lookups on truth_verses", () => {
    expect(schemaContent).toContain("CREATE INDEX IF NOT EXISTS idx_verses_chapter ON truth_verses(chapter_id);");
    expect(schemaContent).toContain("CREATE INDEX IF NOT EXISTS idx_verses_section ON truth_verses(section);");
  });

  it("defines the daily_truth table with a foreign key to truth_verses", () => {
    expect(schemaContent).toMatch(/CREATE TABLE IF NOT EXISTS daily_truth\s*\(/);
    expect(schemaContent).toContain("FOREIGN KEY (verse_id) REFERENCES truth_verses(id)");
    expect(schemaContent).toContain("date TEXT NOT NULL UNIQUE");
  });

  it("defines the rag_cache table with a primary key on query_hash", () => {
    expect(schemaContent).toMatch(/CREATE TABLE IF NOT EXISTS rag_cache\s*\(/);
    expect(schemaContent).toContain("query_hash TEXT PRIMARY KEY");
    expect(schemaContent).toContain("expires_at TEXT NOT NULL");
  });

  it("defines exactly four tables and two indexes", () => {
    const tableMatches = schemaContent.match(/CREATE TABLE IF NOT EXISTS \w+/g) ?? [];
    const indexMatches = schemaContent.match(/CREATE INDEX IF NOT EXISTS \w+/g) ?? [];
    expect(tableMatches).toHaveLength(4);
    expect(indexMatches).toHaveLength(2);
  });
});

describe("docs/archive/iqra-core-schema.sql — basic syntax sanity", () => {
  it("has balanced parentheses across the whole file", () => {
    const opens = (schemaContent.match(/\(/g) ?? []).length;
    const closes = (schemaContent.match(/\)/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  it("every non-comment statement is terminated with a semicolon", () => {
    const statements = extractStatements(schemaContent);
    expect(statements.length).toBeGreaterThan(0);
    for (const statement of statements) {
      // Each extracted statement should begin with a recognized SQL keyword
      expect(statement).toMatch(/^(CREATE TABLE|CREATE INDEX)/);
    }
  });

  it("does not contain destructive statements (DROP, DELETE, TRUNCATE)", () => {
    expect(schemaContent).not.toMatch(/\bDROP\b/i);
    expect(schemaContent).not.toMatch(/\bDELETE\b/i);
    expect(schemaContent).not.toMatch(/\bTRUNCATE\b/i);
  });
});

describe("docs/archive/iqra-core-schema.sql — foreign key ordering (regression)", () => {
  it("defines truth_chapters before truth_verses, which references it via foreign key", () => {
    const chaptersIndex = schemaContent.indexOf("CREATE TABLE IF NOT EXISTS truth_chapters");
    const versesIndex = schemaContent.indexOf("CREATE TABLE IF NOT EXISTS truth_verses");
    expect(chaptersIndex).toBeGreaterThan(-1);
    expect(versesIndex).toBeGreaterThan(chaptersIndex);
  });

  it("defines truth_verses before daily_truth, which references it via foreign key", () => {
    const versesIndex = schemaContent.indexOf("CREATE TABLE IF NOT EXISTS truth_verses");
    const dailyTruthIndex = schemaContent.indexOf("CREATE TABLE IF NOT EXISTS daily_truth");
    expect(versesIndex).toBeGreaterThan(-1);
    expect(dailyTruthIndex).toBeGreaterThan(versesIndex);
  });

  it("rag_cache has no foreign keys and does not depend on ordering relative to other tables", () => {
    const ragCacheMatch = schemaContent.match(/CREATE TABLE IF NOT EXISTS rag_cache\s*\(([\s\S]*?)\);/);
    expect(ragCacheMatch).not.toBeNull();
    expect(ragCacheMatch![1]).not.toContain("FOREIGN KEY");
  });
});