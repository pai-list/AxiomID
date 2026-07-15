/**
 * @jest-environment node
 *
 * Structural tests for public/robots.txt.
 *
 * This PR replaced the previous per-bot allow/disallow rule set (GPTBot,
 * ClaudeBot, PerplexityBot, Bytespider, AhrefsBot, and a restrictive
 * wildcard block) with a single, permissive `User-agent: *` block plus an
 * explicit `Sitemap:` directive. These tests lock in the new, simplified
 * contract and guard against regressions that would reintroduce the removed
 * per-bot rules or drop the sitemap reference.
 */

import fs from "fs";
import path from "path";

const ROBOTS_TXT_PATH = path.join(__dirname, "../../../public/robots.txt");

let content = "";
let lines: string[] = [];

beforeAll(() => {
  if (!fs.existsSync(ROBOTS_TXT_PATH)) {
    return;
  }
  content = fs.readFileSync(ROBOTS_TXT_PATH, "utf-8");
  lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
});

describe("public/robots.txt — file existence", () => {
  it("exists in the public directory", () => {
    expect(fs.existsSync(ROBOTS_TXT_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });
});

describe("public/robots.txt — wildcard user-agent rules", () => {
  it("declares a single wildcard User-agent directive", () => {
    const userAgentLines = lines.filter((l) => l.startsWith("User-agent:"));
    expect(userAgentLines).toHaveLength(1);
    expect(userAgentLines[0]).toBe("User-agent: *");
  });

  it("allows crawling the root path", () => {
    expect(lines).toContain("Allow: /");
  });

  it("allows crawling /llms.txt", () => {
    expect(lines).toContain("Allow: /llms.txt");
  });

  it("allows crawling the /api/did/ path", () => {
    expect(lines).toContain("Allow: /api/did/");
  });
});

describe("public/robots.txt — sitemap directive", () => {
  it("declares the sitemap location", () => {
    expect(content).toContain("Sitemap: https://axiomid.app/sitemap.xml");
  });

  it("sitemap directive uses an absolute HTTPS URL", () => {
    const sitemapLine = lines.find((l) => l.startsWith("Sitemap:"));
    expect(sitemapLine).toBeDefined();
    expect(sitemapLine).toMatch(/^Sitemap: https:\/\//);
  });
});

describe("public/robots.txt — regression: removed per-bot rules", () => {
  it("no longer contains a dedicated GPTBot rule", () => {
    expect(content).not.toContain("User-agent: GPTBot");
  });

  it("no longer contains a dedicated ClaudeBot rule", () => {
    expect(content).not.toContain("User-agent: ClaudeBot");
  });

  it("no longer contains a dedicated PerplexityBot rule", () => {
    expect(content).not.toContain("User-agent: PerplexityBot");
  });

  it("no longer blocks Bytespider", () => {
    expect(content).not.toContain("Bytespider");
  });

  it("no longer blocks AhrefsBot", () => {
    expect(content).not.toContain("AhrefsBot");
  });

  it("no longer disallows the old sensitive routes for the wildcard agent", () => {
    expect(content).not.toContain("Disallow: /api/agent/sign");
    expect(content).not.toContain("Disallow: /api/oauth2/");
    expect(content).not.toContain("Disallow: /dashboard/");
  });

  it("no longer references the old /api/did-document allow rule", () => {
    expect(content).not.toContain("/api/did-document");
  });
});

describe("public/robots.txt — boundary and negative cases", () => {
  it("does not contain any Disallow directive for the wildcard user-agent", () => {
    expect(content).not.toMatch(/Disallow:/);
  });

  it("contains no duplicate Allow lines", () => {
    const allowLines = lines.filter((l) => l.startsWith("Allow:"));
    const unique = new Set(allowLines);
    expect(unique.size).toBe(allowLines.length);
  });
});