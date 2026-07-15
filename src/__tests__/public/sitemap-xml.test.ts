/**
 * @jest-environment node
 *
 * Structural tests for public/sitemap.xml.
 *
 * This file is newly added in this PR to declare the site's canonical pages
 * (home, dashboard, llms.txt) for search engines and AI crawlers referenced
 * from robots.txt's `Sitemap:` directive. These tests validate the document
 * is well-formed XML, uses the correct sitemap schema, and that each
 * expected `<url>` entry carries the required child elements with sane
 * values.
 */

import fs from "fs";
import path from "path";

const SITEMAP_XML_PATH = path.join(__dirname, "../../../public/sitemap.xml");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(SITEMAP_XML_PATH)) {
    return;
  }
  content = fs.readFileSync(SITEMAP_XML_PATH, "utf-8");
});

/** Extract the raw text of every <url>...</url> block. */
function extractUrlBlocks(xml: string): string[] {
  return xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
}

/** Extract the text content of a given tag from a block of XML. */
function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`));
  return match?.[1];
}

describe("public/sitemap.xml — file existence", () => {
  it("exists in the public directory", () => {
    expect(fs.existsSync(SITEMAP_XML_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });
});

describe("public/sitemap.xml — document structure", () => {
  it("starts with an XML declaration specifying UTF-8 encoding", () => {
    expect(content.trimStart()).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("declares the sitemaps.org 0.9 namespace on the <urlset> root element", () => {
    expect(content).toMatch(/<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  });

  it("has matching opening and closing <urlset> tags", () => {
    expect(content).toMatch(/<urlset[^>]*>[\s\S]*<\/urlset>/);
  });

  it("has an equal number of <url> and </url> tags", () => {
    const opens = content.match(/<url>/g) ?? [];
    const closes = content.match(/<\/url>/g) ?? [];
    expect(opens.length).toBe(closes.length);
  });

  it("contains exactly 3 <url> entries", () => {
    expect(extractUrlBlocks(content)).toHaveLength(3);
  });
});

describe("public/sitemap.xml — url entries", () => {
  let blocks: string[];

  beforeAll(() => {
    blocks = extractUrlBlocks(content);
  });

  it("every <url> entry has a <loc>, <lastmod>, <changefreq>, and <priority>", () => {
    blocks.forEach((block) => {
      expect(extractTag(block, "loc")).toBeDefined();
      expect(extractTag(block, "lastmod")).toBeDefined();
      expect(extractTag(block, "changefreq")).toBeDefined();
      expect(extractTag(block, "priority")).toBeDefined();
    });
  });

  it("every <loc> is an absolute https://axiomid.app URL", () => {
    blocks.forEach((block) => {
      expect(extractTag(block, "loc")).toMatch(/^https:\/\/axiomid\.app/);
    });
  });

  it("every <priority> parses to a number between 0 and 1", () => {
    blocks.forEach((block) => {
      const priority = Number(extractTag(block, "priority"));
      expect(Number.isNaN(priority)).toBe(false);
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
    });
  });

  it("includes the homepage with priority 1.0 and daily changefreq", () => {
    const home = blocks.find((b) => extractTag(b, "loc") === "https://axiomid.app/");
    expect(home).toBeDefined();
    expect(extractTag(home!, "priority")).toBe("1.0");
    expect(extractTag(home!, "changefreq")).toBe("daily");
  });

  it("includes the dashboard page with hourly changefreq", () => {
    const dashboard = blocks.find((b) => extractTag(b, "loc") === "https://axiomid.app/dashboard");
    expect(dashboard).toBeDefined();
    expect(extractTag(dashboard!, "changefreq")).toBe("hourly");
    expect(extractTag(dashboard!, "priority")).toBe("0.8");
  });

  it("includes the llms.txt entry referenced by robots.txt's llms.txt allow rule", () => {
    const llms = blocks.find((b) => extractTag(b, "loc") === "https://axiomid.app/llms.txt");
    expect(llms).toBeDefined();
    expect(extractTag(llms!, "changefreq")).toBe("daily");
    expect(extractTag(llms!, "priority")).toBe("0.9");
  });

  it("has no duplicate <loc> values", () => {
    const locs = blocks.map((b) => extractTag(b, "loc"));
    expect(new Set(locs).size).toBe(locs.length);
  });
});

describe("public/sitemap.xml — boundary and negative cases", () => {
  it("does not contain unescaped ampersands in URLs", () => {
    expect(content).not.toMatch(/<loc>[^<]*&(?!amp;)[^<]*<\/loc>/);
  });

  it("file ends with a newline character", () => {
    expect(content).toMatch(/\n$/);
  });
});