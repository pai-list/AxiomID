/**
 * Content tests for templates/skill-template.md
 *
 * PR change: the "مبدأ التوافق — Principle Alignment" section's guidance
 * comment was extended with a worked example (aligning to Vigilance /
 * Muraqabah). In the same edit the comment's internal line breaks were
 * written as literal `\n` escape sequences rather than real newlines, so
 * the entire comment now lives on a single physical line in the file.
 */

import fs from "fs";
import path from "path";
import { validateManifest, describeManifestIssues } from "@/lib/validators";

const templatePath = path.join(__dirname, "..", "..", "..", "templates", "skill-template.md");
const templateContent = fs.readFileSync(templatePath, "utf-8");

describe("skill-template.md — Principle Alignment section (PR change)", () => {
  it("still contains the original guidance about naming the SOUL principle", () => {
    expect(templateContent).toContain("Describe which SOUL principle this skill serves.");
    expect(templateContent).toContain("Vigilance / Correction / Ledger / Triad / Septet / Compounding.");
  });

  it("adds a worked example referencing Vigilance (Muraqabah)", () => {
    expect(templateContent).toContain("Example:");
    expect(templateContent).toContain(
      "This skill aligns with **Vigilance (Muraqabah)**. Every mutating action is logged to ensure complete intention transparency and divine awareness of all state changes."
    );
  });

  it("keeps the 'Required.' instruction after the new example", () => {
    // The example text must precede the closing "Required." reminder, not replace it.
    const exampleIndex = templateContent.indexOf("Example:");
    const requiredIndex = templateContent.indexOf("Required.", exampleIndex);
    expect(exampleIndex).toBeGreaterThan(-1);
    expect(requiredIndex).toBeGreaterThan(exampleIndex);
  });

  it("pins the exact comment text for the Principle Alignment section", () => {
    expect(templateContent).toContain(
      "<!-- TODO: Describe which SOUL principle this skill serves.\\n" +
        "     Vigilance / Correction / Ledger / Triad / Septet / Compounding.\\n\\n" +
        "     Example:\\n" +
        "     This skill aligns with **Vigilance (Muraqabah)**. Every mutating action is logged to ensure complete intention transparency and divine awareness of all state changes.\\n\\n" +
        "     Required. -->"
    );
  });

  it("writes the comment's internal breaks as literal backslash-n rather than real newlines", () => {
    const lines = templateContent.split("\n");
    const principleLines = lines.filter((l) => l.includes("Describe which SOUL principle"));

    // Regression/boundary check: the whole comment, including the new example,
    // must remain on exactly one physical line (matching the PR's actual output),
    // rather than spanning several real newline-separated lines.
    expect(principleLines).toHaveLength(1);
    const principleLine = principleLines[0];
    expect(principleLine.startsWith("<!-- TODO: Describe which SOUL principle")).toBe(true);
    expect(principleLine.endsWith("-->")).toBe(true);
    expect(principleLine).toContain("\\n");
  });
});

describe("skill-template.md — document structure (regression)", () => {
  it("still declares all five top-level sections in order", () => {
    const headers = [
      "## الغرض — Purpose",
      "## مبدأ التوافق — Principle Alignment",
      "## سير التشغيل — Operational Flow",
      "## أنماط الفشل — Failure Modes",
      "## الوسوم — Tags",
    ];

    let searchFrom = 0;
    for (const header of headers) {
      const index = templateContent.indexOf(header, searchFrom);
      expect(index).toBeGreaterThanOrEqual(searchFrom);
      searchFrom = index + header.length;
    }
  });

  it("leaves the Purpose section comment untouched", () => {
    expect(templateContent).toContain(
      "<!-- TODO: Define what this skill does in 1-2 sentences. Required. -->"
    );
  });

  it("leaves the Operational Flow section as a real multi-line comment", () => {
    expect(templateContent).toContain(
      "<!-- TODO: List numbered steps describing execution. Required.\n     1. Step one\n     2. Step two\n     3. Step three -->"
    );
  });

  it("leaves the Failure Modes section as a real multi-line comment", () => {
    expect(templateContent).toContain(
      "<!-- TODO: Table of failure modes and recovery. Required.\n     | Mode | Detection | Recovery | -->"
    );
  });

  it("leaves the optional Tags section untouched", () => {
    expect(templateContent).toContain("<!-- Optional: comma-separated tags. -->");
  });

  it("keeps every HTML comment opener matched by a closer", () => {
    const openers = (templateContent.match(/<!--/g) || []).length;
    const closers = (templateContent.match(/-->/g) || []).length;
    expect(openers).toBeGreaterThan(0);
    expect(openers).toBe(closers);
  });
});

describe("skill-template.md — compatibility with the existing manifest validator", () => {
  it("is parsed with all four required section headers present (none missing)", () => {
    const result = validateManifest(templateContent);
    expect(result.missing).toEqual([]);
  });

  it("is still flagged invalid because every required section remains a placeholder", () => {
    // Boundary case: even though the Principle Alignment section grew a
    // detailed worked example, it is still entirely wrapped in an HTML
    // comment, so the validator must continue to treat it as a stub rather
    // than mistaking the extra prose for real skill content.
    const result = validateManifest(templateContent);
    expect(result.valid).toBe(false);
    expect(result.stubs).toEqual(
      expect.arrayContaining([
        "الغرض — Purpose",
        "مبدأ التوافق — Principle Alignment",
        "سير التشغيل — Operational Flow",
        "أنماط الفشل — Failure Modes",
      ])
    );
  });

  it("reports a placeholder-content issue for the Principle Alignment section via describeManifestIssues", () => {
    const issues = describeManifestIssues(templateContent);
    expect(issues).toContain(
      'section "مبدأ التوافق — Principle Alignment" contains placeholder or empty content'
    );
  });
});