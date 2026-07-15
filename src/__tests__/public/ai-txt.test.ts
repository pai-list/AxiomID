/**
 * @jest-environment node
 *
 * Structural tests for public/ai.txt.
 *
 * public/ai.txt is newly added in this PR as a lightweight pointer that
 * redirects generic AI-agent crawlers to the canonical /llms.txt document.
 * These tests lock in its existence and exact guidance content.
 */

import fs from "fs";
import path from "path";

const AI_TXT_PATH = path.join(__dirname, "../../../public/ai.txt");

let content = "";

beforeAll(() => {
  if (!fs.existsSync(AI_TXT_PATH)) {
    return;
  }
  content = fs.readFileSync(AI_TXT_PATH, "utf-8");
});

describe("public/ai.txt — file existence", () => {
  it("exists in the public directory", () => {
    expect(fs.existsSync(AI_TXT_PATH)).toBe(true);
  });

  it("is non-empty", () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });
});

describe("public/ai.txt — content", () => {
  it("informs agents it redirects to /llms.txt", () => {
    expect(content).toContain("Redirecting to /llms.txt");
  });

  it("welcomes all AI agents", () => {
    expect(content).toContain("AxiomID welcomes all AI Agents.");
  });

  it("instructs crawlers to index /llms.txt for machine-readable context", () => {
    expect(content).toContain("Please index /llms.txt for machine-readable context.");
  });

  it("consists of exactly two non-empty lines", () => {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(2);
  });

  it("file ends with a newline character", () => {
    expect(content).toMatch(/\n$/);
  });
});