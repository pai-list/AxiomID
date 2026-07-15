/**
 * @jest-environment node
 *
 * Structural tests for .github/workflows/release-tag.yml.
 *
 * This workflow runs on every push to `main` and automatically cuts a
 * GitHub release: it extracts the newest dated version heading from
 * CHANGELOG.md, checks whether the corresponding `vX.Y.Z` tag already
 * exists, and — if not — creates the tag and a GitHub Release from the
 * matching changelog section. Because it runs unattended on every push to
 * main with `contents: write`, regressions here (an over-broad permission,
 * an unpinned/mutable action reference, a broken re-trigger guard, or a
 * change to the version/tag-existence shell logic) can silently create bad
 * tags/releases or open a release-loop. These tests lock in that shape.
 *
 * No YAML parsing library is available in this project, so the file is
 * validated with targeted line-based parsing, mirroring the approach used
 * for other unparsed config files (see label-workflow.test.ts).
 */

import fs from "fs";
import path from "path";

const WORKFLOW_PATH = path.join(
  __dirname,
  "../../.github/workflows/release-tag.yml",
);

let content = "";
let lines: string[] = [];

beforeAll(() => {
  if (!fs.existsSync(WORKFLOW_PATH)) {
    return;
  }
  content = fs.readFileSync(WORKFLOW_PATH, "utf-8");
  lines = content.split("\n");
});

/** Return the index of the first line matching the given predicate, or -1. */
function findLineIndex(predicate: (line: string) => boolean): number {
  return lines.findIndex(predicate);
}

// ---------------------------------------------------------------------------
// File existence and basic structure
// ---------------------------------------------------------------------------

describe("release-tag.yml — file structure", () => {
  it("exists at .github/workflows/release-tag.yml", () => {
    expect(fs.existsSync(WORKFLOW_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("contains no tab characters (YAML requires spaces for indentation)", () => {
    expect(content).not.toMatch(/\t/);
  });
});

// ---------------------------------------------------------------------------
// Workflow name and trigger
// ---------------------------------------------------------------------------

describe("release-tag.yml — name and trigger", () => {
  it("names the workflow 'Auto Release'", () => {
    expect(content).toMatch(/^name:\s*Auto Release\s*$/m);
  });

  it("triggers on push", () => {
    expect(content).toMatch(/^on:\s*$/m);
    expect(content).toMatch(/^\s*push:\s*$/m);
  });

  it("scopes the push trigger to the main branch only", () => {
    expect(content).toMatch(/^\s*branches:\s*\[main\]\s*$/m);
  });

  it("does not also trigger on pull_request (release must only fire on main)", () => {
    expect(content).not.toMatch(/^\s*pull_request:?\s*$/m);
  });
});

// ---------------------------------------------------------------------------
// Concurrency — avoid overlapping/duplicate release runs
// ---------------------------------------------------------------------------

describe("release-tag.yml — concurrency", () => {
  it("defines a concurrency group scoped to the ref", () => {
    expect(content).toMatch(
      /^\s*group:\s*release-\$\{\{\s*github\.ref\s*\}\}\s*$/m,
    );
  });

  it("cancels in-progress runs for the same ref", () => {
    expect(content).toMatch(/^\s*cancel-in-progress:\s*true\s*$/m);
  });
});

// ---------------------------------------------------------------------------
// Permissions — least privilege
// ---------------------------------------------------------------------------

describe("release-tag.yml — permissions (least privilege)", () => {
  it("grants write access to contents (needed to push tags and create releases)", () => {
    expect(content).toMatch(/^\s*contents:\s*write\s*$/m);
  });

  it("does not request any additional, unused permission scopes", () => {
    const permissionsIndex = findLineIndex((l) => /^permissions:\s*$/.test(l));
    expect(permissionsIndex).toBeGreaterThanOrEqual(0);
    const permissionLines = lines
      .slice(permissionsIndex + 1)
      .filter((l) => /^\s{2}[a-z-]+:\s*(read|write|none)\s*$/.test(l));
    const scopes = permissionLines.map((l) => l.trim().split(":")[0]);
    expect(scopes).toEqual(["contents"]);
  });
});

// ---------------------------------------------------------------------------
// Job configuration
// ---------------------------------------------------------------------------

describe("release-tag.yml — job configuration", () => {
  it("defines a 'tag' job", () => {
    expect(content).toMatch(/^\s*tag:\s*$/m);
  });

  it("runs the tag job on ubuntu-latest", () => {
    expect(content).toMatch(/^\s*runs-on:\s*ubuntu-latest\s*$/m);
  });

  it("defines exactly one job", () => {
    const jobsIndex = findLineIndex((l) => /^jobs:\s*$/.test(l));
    expect(jobsIndex).toBeGreaterThanOrEqual(0);
    const jobKeyLines = lines
      .slice(jobsIndex + 1)
      .filter((l) => /^ {2}\S.*:\s*$/.test(l));
    expect(jobKeyLines).toHaveLength(1);
    expect(jobKeyLines[0].trim()).toBe("tag:");
  });

  it("guards against re-triggering on its own release commit", () => {
    // Without this guard, a commit created by the release step itself could
    // re-trigger the workflow on push, risking a release loop.
    expect(content).toMatch(
      /^\s*if:\s*github\.event\.head_commit\.message\s*!=\s*'chore\(release\):'\s*$/m,
    );
  });

  it("checks out full history (fetch-depth: 0) so tag listing/creation works", () => {
    expect(content).toMatch(/^\s*fetch-depth:\s*0\s*$/m);
  });
});

// ---------------------------------------------------------------------------
// Steps — pinned action references
// ---------------------------------------------------------------------------

describe("release-tag.yml — pinned action references", () => {
  it("pins actions/checkout to a full commit SHA with a version comment", () => {
    const usesLine = lines.find(
      (l) => l.includes("uses:") && l.includes("actions/checkout"),
    );
    expect(usesLine).toBeDefined();
    expect(usesLine).toMatch(/actions\/checkout@[0-9a-f]{40}\s*#\s*v\d+\.\d+\.\d+/);
    expect(usesLine).not.toMatch(/@(main|master|latest)\b/);
  });

  it("pins softprops/action-gh-release to a full commit SHA with a version comment", () => {
    const usesLine = lines.find(
      (l) => l.includes("uses:") && l.includes("softprops/action-gh-release"),
    );
    expect(usesLine).toBeDefined();
    expect(usesLine).toMatch(
      /softprops\/action-gh-release@[0-9a-f]{40}\s*#\s*v\d+\.\d+\.\d+/,
    );
    expect(usesLine).not.toMatch(/@(main|master|latest)\b/);
  });

  it("uses exactly two actions (checkout, action-gh-release)", () => {
    const usesLines = lines.filter((l) => /^\s*-?\s*uses:\s*\S/.test(l));
    expect(usesLines).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Steps — CHANGELOG version extraction
// ---------------------------------------------------------------------------

describe("release-tag.yml — Extract version from CHANGELOG step", () => {
  it("has id 'changelog'", () => {
    expect(content).toMatch(/^\s*id:\s*changelog\s*$/m);
  });

  it("extracts a semver from a dated '## [x.y.z] - YYYY-MM-DD' heading", () => {
    expect(content).toContain(
      "grep -m1 -oP '^## \\[\\K[0-9]+\\.[0-9]+\\.[0-9]+(?=.*\\d{4}-\\d{2}-\\d{2})' CHANGELOG.md",
    );
  });

  it("falls back to an empty string instead of failing the step when no version is found", () => {
    expect(content).toContain('|| echo ""');
  });

  it("writes the extracted version to GITHUB_OUTPUT", () => {
    expect(content).toContain('echo "version=$VERSION" >> "$GITHUB_OUTPUT"');
  });
});

// ---------------------------------------------------------------------------
// Steps — tag existence check
// ---------------------------------------------------------------------------

describe("release-tag.yml — Check tag existence step", () => {
  it("has id 'tag'", () => {
    expect(content).toMatch(/^\s*id:\s*tag\s*$/m);
  });

  it("skips (exists=skip) when no version was extracted from the changelog", () => {
    expect(content).toContain('echo "exists=skip" >> "$GITHUB_OUTPUT"');
    expect(content).toMatch(/if\s*\[\s*-z\s*"\$VERSION"\s*\];\s*then/);
  });

  it("checks for the tag using 'git tag -l' rather than a network fetch", () => {
    expect(content).toMatch(/git tag -l "\$TAG" \| grep -q \./);
  });

  it("prefixes the version with 'v' to form the tag name", () => {
    expect(content).toContain('TAG="v$VERSION"');
  });

  it("sets exists=true when the tag already exists, and exists=false otherwise", () => {
    expect(content).toContain('echo "exists=true" >> "$GITHUB_OUTPUT"');
    expect(content).toContain('echo "exists=false" >> "$GITHUB_OUTPUT"');
  });
});

// ---------------------------------------------------------------------------
// Steps — conditional release creation
// ---------------------------------------------------------------------------

describe("release-tag.yml — downstream steps are gated on tag existence", () => {
  it("gates 'Extract release body' on steps.tag.outputs.exists == 'false'", () => {
    const idx = findLineIndex((l) => /name:\s*Extract release body/.test(l));
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(lines[idx + 2]).toMatch(
      /if:\s*steps\.tag\.outputs\.exists\s*==\s*'false'/,
    );
  });

  it("gates 'Create tag' on steps.tag.outputs.exists == 'false'", () => {
    const idx = findLineIndex((l) => /name:\s*Create tag\s*$/.test(l));
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(lines[idx + 1]).toMatch(
      /if:\s*steps\.tag\.outputs\.exists\s*==\s*'false'/,
    );
  });

  it("gates 'Create GitHub Release' on steps.tag.outputs.exists == 'false'", () => {
    const idx = findLineIndex((l) => /name:\s*Create GitHub Release/.test(l));
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(lines[idx + 1]).toMatch(
      /if:\s*steps\.tag\.outputs\.exists\s*==\s*'false'/,
    );
  });

  it("does not gate 'Extract version from CHANGELOG' or 'Check tag existence' (they must always run)", () => {
    const changelogIdx = findLineIndex((l) =>
      /name:\s*Extract version from CHANGELOG/.test(l),
    );
    const tagCheckIdx = findLineIndex((l) => /name:\s*Check tag existence/.test(l));
    expect(lines[changelogIdx + 2]).not.toMatch(/if:/);
    expect(lines[tagCheckIdx + 2]).not.toMatch(/if:/);
  });
});

// ---------------------------------------------------------------------------
// Steps — tag creation and push
// ---------------------------------------------------------------------------

describe("release-tag.yml — Create tag step", () => {
  it("configures a dedicated bot git identity before tagging", () => {
    expect(content).toContain('git config user.name "axiomid-release-bot"');
    expect(content).toContain('git config user.email "bot@axiomid.app"');
  });

  it("creates an annotated tag (git tag -a) rather than a lightweight tag", () => {
    expect(content).toMatch(/git tag -a "v\$\{\{\s*steps\.changelog\.outputs\.version\s*\}\}"/);
  });

  it("pushes the newly created tag to origin", () => {
    expect(content).toMatch(/git push origin "v\$\{\{\s*steps\.changelog\.outputs\.version\s*\}\}"/);
  });
});

// ---------------------------------------------------------------------------
// Steps — GitHub Release creation
// ---------------------------------------------------------------------------

describe("release-tag.yml — Create GitHub Release step", () => {
  it("tags the release with the extracted version, prefixed with 'v'", () => {
    expect(content).toMatch(
      /tag_name:\s*v\$\{\{\s*steps\.changelog\.outputs\.version\s*\}\}/,
    );
  });

  it("uses the body extracted in the previous step", () => {
    expect(content).toMatch(/body:\s*\$\{\{\s*steps\.body\.outputs\.body\s*\}\}/);
  });

  it("disables auto-generated release notes (relies on CHANGELOG body instead)", () => {
    expect(content).toMatch(/^\s*generate_release_notes:\s*false\s*$/m);
  });
});

// ---------------------------------------------------------------------------
// Regression: overall shape stays intact
// ---------------------------------------------------------------------------

describe("release-tag.yml — regression: key sections appear in expected order", () => {
  it("orders sections as name -> on -> permissions -> concurrency -> jobs", () => {
    const nameIdx = findLineIndex((l) => /^name:/.test(l));
    const onIdx = findLineIndex((l) => /^on:/.test(l));
    const permissionsIdx = findLineIndex((l) => /^permissions:\s*$/.test(l));
    const concurrencyIdx = findLineIndex((l) => /^concurrency:\s*$/.test(l));
    const jobsIdx = findLineIndex((l) => /^jobs:\s*$/.test(l));

    expect(nameIdx).toBeGreaterThanOrEqual(0);
    expect(onIdx).toBeGreaterThan(nameIdx);
    expect(permissionsIdx).toBeGreaterThan(onIdx);
    expect(concurrencyIdx).toBeGreaterThan(permissionsIdx);
    expect(jobsIdx).toBeGreaterThan(concurrencyIdx);
  });

  it("defines exactly six steps in the tag job", () => {
    const stepStartLines = lines.filter((l) =>
      /^\s{6}-\s*(uses|name):/.test(l),
    );
    expect(stepStartLines).toHaveLength(6);
  });
});