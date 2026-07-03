/**
 * @jest-environment node
 *
 * Structural tests for templates/skill-template.md.
 *
 * This PR filled in the "Principle Alignment", "Operational Flow", "Failure
 * Modes", and "Tags" sections of the skill authoring template with concrete
 * bilingual (Arabic/English) guidance and example content, replacing the
 * previous `<!-- TODO -->` placeholders. The "Purpose" section intentionally
 * remains a TODO placeholder for skill authors to fill in.
 *
 * These tests lock in the required section headers, guard against
 * accidental removal of the newly-added guidance, and confirm that the
 * template's content is consistent with the manifest validation logic in
 * `src/lib/validators.ts` used by `scripts/validate-skill-manifest.ts` and
 * the `skill-quality` CI workflow.
 */

import fs from "fs";
import path from "path";
import { validateManifest } from "@/lib/validators";

const TEMPLATE_PATH = path.join(__dirname, "../../templates/skill-template.md");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    return;
  }
  content = fs.readFileSync(TEMPLATE_PATH, "utf-8");
});

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — file existence", () => {
  it("exists at templates/skill-template.md", () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("ends with a newline character", () => {
    expect(content).toMatch(/\n$/);
  });

  it("does not contain unresolved merge-conflict markers", () => {
    expect(content).not.toMatch(/^(<{7}|={7}|>{7})/m);
  });
});

// ---------------------------------------------------------------------------
// Required section headers (must match src/lib/validators.ts REQUIRED_MANIFEST_SECTIONS)
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — required section headers", () => {
  const requiredHeaders = [
    "## الغرض — Purpose",
    "## مبدأ التوافق — Principle Alignment",
    "## سير التشغيل — Operational Flow",
    "## أنماط الفشل — Failure Modes",
  ];

  it.each(requiredHeaders)("contains header '%s'", (header) => {
    expect(content).toContain(header);
  });

  it("preserves the headers in document order", () => {
    const indices = requiredHeaders.map((h) => content.indexOf(h));
    indices.forEach((idx) => expect(idx).toBeGreaterThanOrEqual(0));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// Purpose section — untouched by this PR, must remain a TODO placeholder
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — Purpose section (unchanged)", () => {
  it("still contains the TODO placeholder comment", () => {
    expect(content).toMatch(
      /<!-- TODO: Define what this skill does in 1-2 sentences\. Required\. -->/,
    );
  });
});

// ---------------------------------------------------------------------------
// Principle Alignment section — filled in by this PR
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — Principle Alignment section (added in PR)", () => {
  it("describes alignment with SOUL principles in Arabic", () => {
    expect(content).toContain(
      "تتوافق هذه المهارة مع مبادئ SOUL من خلال تحديد المبدأ المناسب",
    );
  });

  it("lists the active SOUL principle options in Arabic", () => {
    ["اليقظة", "التصحيح", "السباعية", "الأخلاقي", "المراجعة الذاتية"].forEach(
      (principle) => {
        expect(content).toContain(principle);
      },
    );
  });

  it("retains updated English guidance naming the SOUL principle terms", () => {
    expect(content).toContain(
      "Vigilance (Muraqabah) / Correction (Tawbah) / Septet (Sab'iyyah) / Ethical / Self-Review.",
    );
  });
});

// ---------------------------------------------------------------------------
// Operational Flow section — filled in by this PR
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — Operational Flow section (added in PR)", () => {
  function extractSection(header: string): string {
    const start = content.indexOf(header);
    expect(start).toBeGreaterThanOrEqual(0);
    const afterHeader = content.slice(start + header.length);
    const nextHeaderMatch = afterHeader.match(/^## .+$/m);
    const end = nextHeaderMatch ? afterHeader.indexOf(nextHeaderMatch[0]) : afterHeader.length;
    return afterHeader.slice(0, end).trim();
  }

  it("contains exactly 5 numbered steps", () => {
    const section = extractSection("## سير التشغيل — Operational Flow");
    const steps = section.match(/^\d+\.\s.+$/gm) ?? [];
    expect(steps).toHaveLength(5);
  });

  it("numbers the steps sequentially from 1 to 5", () => {
    const section = extractSection("## سير التشغيل — Operational Flow");
    const steps = section.match(/^(\d+)\./gm) ?? [];
    const numbers = steps.map((s) => parseInt(s, 10));
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it("pairs each Arabic step with an indented English translation line", () => {
    const section = extractSection("## سير التشغيل — Operational Flow");
    const lines = section.split("\n").filter((l) => l.trim().length > 0);
    // Expect alternating: numbered Arabic line, then indented English line.
    for (let i = 0; i < lines.length; i += 2) {
      expect(lines[i]).toMatch(/^\d+\.\s+\S/);
      expect(lines[i + 1]).toMatch(/^\s+[A-Z]/);
    }
  });

  it("describes identity verification via AxiomID DID", () => {
    expect(content).toMatch(/Verify agent identity \(AxiomID DID\) and access permissions\./);
  });

  it("describes attesting and digitally signing outputs", () => {
    expect(content).toMatch(/Attest and digitally sign outputs to ensure data integrity\./);
  });

  it("describes updating the decentralized Ledger when necessary", () => {
    expect(content).toMatch(/update the decentralized Ledger if necessary\./);
  });

  it("places identity verification before core logic execution", () => {
    const section = extractSection("## سير التشغيل — Operational Flow");
    const identityIdx = section.indexOf("Verify agent identity");
    const coreLogicIdx = section.indexOf("execute the skill's core logic");
    expect(identityIdx).toBeGreaterThanOrEqual(0);
    expect(coreLogicIdx).toBeGreaterThan(identityIdx);
  });
});

// ---------------------------------------------------------------------------
// Failure Modes section — filled in by this PR
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — Failure Modes section (added in PR)", () => {
  function extractSection(header: string): string {
    const start = content.indexOf(header);
    expect(start).toBeGreaterThanOrEqual(0);
    const afterHeader = content.slice(start + header.length);
    const nextHeaderMatch = afterHeader.match(/^## .+$/m);
    const end = nextHeaderMatch ? afterHeader.indexOf(nextHeaderMatch[0]) : afterHeader.length;
    return afterHeader.slice(0, end).trim();
  }

  it("renders a Markdown table with the bilingual header row", () => {
    expect(content).toContain(
      "| النمط (Mode) | الكشف (Detection) | الاسترداد (Recovery) |",
    );
  });

  it("includes the table divider row", () => {
    expect(content).toContain("| :--- | :--- | :--- |");
  });

  it("contains exactly 2 data rows (excluding header and divider)", () => {
    const section = extractSection("## أنماط الفشل — Failure Modes");
    const rows = section.split("\n").filter((l) => l.trim().startsWith("|"));
    // First row = header, second row = divider, remaining = data rows.
    expect(rows.length - 2).toBe(2);
  });

  it("documents an identity failure mode with error code AXIOM_E401", () => {
    expect(content).toContain("فشل الهوية (Identity Failure)");
    expect(content).toContain("Reject request with AXIOM_E401");
  });

  it("documents a timeout failure mode with bounded exponential backoff retry", () => {
    expect(content).toContain("تجاوز المهلة (Timeout)");
    expect(content).toMatch(/Cancel and retry \(max 3 cycles with exponential backoff\)/);
  });
});

// ---------------------------------------------------------------------------
// Tags section — filled in by this PR
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — Tags section (added in PR)", () => {
  it("contains the Tags header", () => {
    expect(content).toContain("## الوسوم — Tags");
  });

  it("no longer contains the 'Optional: comma-separated tags' placeholder comment", () => {
    expect(content).not.toMatch(/<!--\s*Optional: comma-separated tags\.\s*-->/);
  });

  it("lists exactly 3 comma-separated tags", () => {
    const start = content.indexOf("## الوسوم — Tags");
    expect(start).toBeGreaterThanOrEqual(0);
    const tagsLine = content
      .slice(start)
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith("#"));
    expect(tagsLine).toBeDefined();
    const tags = (tagsLine as string).split(",").map((t) => t.trim());
    expect(tags).toEqual(["axiom-identity", "agent-skill", "decentralized-logic"]);
  });

  it("formats every tag as lowercase alphanumeric with hyphens (slug-like)", () => {
    const start = content.indexOf("## الوسوم — Tags");
    const tagsLine = content
      .slice(start)
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith("#")) as string;
    const tags = tagsLine.split(",").map((t) => t.trim());
    tags.forEach((tag) => {
      expect(tag).toMatch(/^[a-z0-9-]+$/);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration with the manifest validator (src/lib/validators.ts)
// ---------------------------------------------------------------------------

describe("templates/skill-template.md — manifest validator integration", () => {
  it("has no missing required sections", () => {
    const result = validateManifest(content);
    expect(result.missing).toEqual([]);
  });

  it("flags only the untouched Purpose section as a stub", () => {
    const result = validateManifest(content);
    expect(result.stubs).toEqual(["الغرض — Purpose"]);
  });

  it("no longer flags Principle Alignment as a stub (filled in by this PR)", () => {
    const result = validateManifest(content);
    expect(result.stubs).not.toContain("مبدأ التوافق — Principle Alignment");
  });

  it("no longer flags Operational Flow as a stub (filled in by this PR)", () => {
    const result = validateManifest(content);
    expect(result.stubs).not.toContain("سير التشغيل — Operational Flow");
  });

  it("no longer flags Failure Modes as a stub (filled in by this PR)", () => {
    const result = validateManifest(content);
    expect(result.stubs).not.toContain("أنماط الفشل — Failure Modes");
  });

  it("is still overall invalid as a manifest, by design, until Purpose is filled in", () => {
    // The template is meant to be copied and customized by skill authors;
    // the Purpose placeholder must be replaced before it becomes a valid
    // manifest, so `validateManifest` should still report `valid: false`.
    const result = validateManifest(content);
    expect(result.valid).toBe(false);
  });
});