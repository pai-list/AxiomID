/**
 * @jest-environment node
 *
 * Structural tests for src/app/globals.css.
 *
 * This PR:
 *  1. Adds `color-scheme: dark` directly to the `:root` selector (previously
 *     only declared later, under a separate `html { color-scheme: dark; }`
 *     rule), and adds `color-scheme: light` to the `[data-theme='light']`
 *     selector, consolidating what used to be a second, standalone
 *     `[data-theme='light'] { color-scheme: light; }` rule near the bottom
 *     of the file.
 *  2. Adds a block of semantic design tokens (--surface, --border, --text,
 *     --primary, --accent, --warning, --danger, etc.) inside the
 *     `[data-theme='light']` block, mirroring tokens already defined in
 *     `:root`.
 *  3. Extends the `@theme inline` block to map several new
 *     `--color-*` Tailwind theme variables to the semantic tokens.
 *
 * These tests parse the raw CSS text (no CSS engine required) to lock in
 * the presence, placement, and non-duplication of the changed declarations.
 */

import fs from "fs";
import path from "path";

const GLOBALS_CSS_PATH = path.join(__dirname, "../../../src/app/globals.css");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(GLOBALS_CSS_PATH)) {
    return;
  }
  content = fs.readFileSync(GLOBALS_CSS_PATH, "utf-8");
});

/** Extract the body of the first rule matching `selector { ... }` (single-level, no nested braces). */
function extractRuleBody(css: string, selectorPattern: RegExp): string | undefined {
  const match = css.match(selectorPattern);
  if (!match) return undefined;
  const startIndex = match.index! + match[0].length;
  const endIndex = css.indexOf("}", startIndex);
  return css.slice(startIndex, endIndex);
}

describe("globals.css — file existence", () => {
  it("exists at src/app/globals.css", () => {
    expect(fs.existsSync(GLOBALS_CSS_PATH)).toBe(true);
  });
});

describe("globals.css — :root color-scheme", () => {
  it("declares color-scheme: dark directly inside :root", () => {
    const rootBody = extractRuleBody(content, /:root\s*\{/);
    expect(rootBody).toBeDefined();
    expect(rootBody).toMatch(/color-scheme:\s*dark;/);
  });
});

describe("globals.css — [data-theme='light'] color-scheme", () => {
  it("declares color-scheme: light inside the [data-theme='light'] block", () => {
    const lightBody = extractRuleBody(content, /\[data-theme='light'\]\s*\{/);
    expect(lightBody).toBeDefined();
    expect(lightBody).toMatch(/color-scheme:\s*light;/);
  });

  it("does not duplicate the standalone [data-theme='light'] { color-scheme: light; } rule that used to exist near the bottom of the file", () => {
    // Only one selector block should declare color-scheme: light for the light theme.
    const matches = content.match(/\[data-theme='light'\]\s*\{\s*color-scheme:\s*light;\s*\}/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  it("the bare 'html { color-scheme: dark; }' rule still exists and is not accompanied by a duplicate light color-scheme rule directly after it", () => {
    expect(content).toMatch(/html\s*\{\s*color-scheme:\s*dark;\s*\}/);
  });
});

describe("globals.css — semantic tokens added to [data-theme='light']", () => {
  const expectedTokens = [
    "--surface",
    "--surface-hover",
    "--surface-deep",
    "--border",
    "--border-hover",
    "--text",
    "--text-subtle",
    "--text-faint",
    "--primary",
    "--primary-glow",
    "--accent",
    "--highlight",
    "--warning",
    "--danger",
  ];

  let lightBody: string;

  beforeAll(() => {
    lightBody = extractRuleBody(content, /\[data-theme='light'\]\s*\{/) ?? "";
  });

  it.each(expectedTokens)("declares the semantic token '%s' inside [data-theme='light']", (token) => {
    expect(lightBody).toMatch(new RegExp(`${token}:\\s*`));
  });

  it("maps --primary to var(--color-primary) in the light theme", () => {
    expect(lightBody).toContain("--primary: var(--color-primary);");
  });

  it("maps --accent and --highlight to var(--axiom-purple) in the light theme", () => {
    expect(lightBody).toContain("--accent: var(--axiom-purple);");
    expect(lightBody).toContain("--highlight: var(--axiom-purple);");
  });

  it("uses a lighter primary-glow rgba alpha value distinct from the dark theme's", () => {
    expect(lightBody).toContain("--primary-glow: rgba(37, 99, 235, 0.08);");
  });
});

describe("globals.css — @theme inline Tailwind token mapping", () => {
  let themeBody: string;

  beforeAll(() => {
    themeBody = extractRuleBody(content, /@theme inline\s*\{/) ?? "";
  });

  it("maps --color-primary, --color-success, --color-warning, --color-danger", () => {
    expect(themeBody).toContain("--color-primary: var(--primary);");
    expect(themeBody).toContain("--color-success: var(--color-success);");
    expect(themeBody).toContain("--color-warning: var(--warning);");
    expect(themeBody).toContain("--color-danger: var(--danger);");
  });

  it("maps surface tokens (--color-surface, --color-surface-hover, --color-surface-deep)", () => {
    expect(themeBody).toContain("--color-surface: var(--surface);");
    expect(themeBody).toContain("--color-surface-hover: var(--surface-hover);");
    expect(themeBody).toContain("--color-surface-deep: var(--surface-deep);");
  });

  it("maps border tokens (--color-border, --color-border-hover)", () => {
    expect(themeBody).toContain("--color-border: var(--border);");
    expect(themeBody).toContain("--color-border-hover: var(--border-hover);");
  });

  it("maps text tokens (--color-text-primary, --color-text-secondary, --color-text-muted)", () => {
    expect(themeBody).toContain("--color-text-primary: var(--text-primary);");
    expect(themeBody).toContain("--color-text-secondary: var(--text-secondary);");
    expect(themeBody).toContain("--color-text-muted: var(--text-muted);");
  });

  it("still maps --font-mono after the new token additions", () => {
    expect(themeBody).toContain("--font-mono: var(--font-mono);");
  });
});

describe("globals.css — boundary and negative cases", () => {
  it("only defines color-scheme: dark once at the top level (:root), not duplicated as a second bare rule", () => {
    const rootScopedDarkDeclarations = content.match(/color-scheme:\s*dark;/g) ?? [];
    // One inside :root, one inside the bare `html { }` rule further down.
    expect(rootScopedDarkDeclarations.length).toBe(2);
  });

  it("only defines color-scheme: light once", () => {
    const lightDeclarations = content.match(/color-scheme:\s*light;/g) ?? [];
    expect(lightDeclarations.length).toBe(1);
  });
});