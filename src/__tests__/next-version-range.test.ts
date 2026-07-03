/**
 * Structural tests for the package.json / package-lock.json PR change:
 * the "next" dependency was loosened from a pinned exact version
 * ("16.2.9") to a caret range ("^16.2.9") to allow compatible patch/minor
 * upgrades, in both package.json and package-lock.json.
 */

import fs from "node:fs";
import path from "node:path";
import packageJson from "../../package.json";

// package-lock.json is loaded via fs/JSON.parse (rather than a static ES
// import) to avoid TypeScript inferring an excessively large literal type
// for this multi-thousand-entry lockfile.
const packageLockJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package-lock.json"), "utf-8")
) as {
  packages: {
    "": { dependencies: Record<string, string> };
    "node_modules/next": { version: string; resolved: string };
  };
};

describe("package.json — next dependency version range (PR change)", () => {
  it("uses a caret range for next instead of a pinned exact version", () => {
    expect(packageJson.dependencies.next).toBe("^16.2.9");
  });

  it("the caret range still targets the next 16.x major version", () => {
    expect(packageJson.dependencies.next.replace(/^\^/, "")).toMatch(/^16\./);
  });
});

describe("package-lock.json — next dependency version range (PR change)", () => {
  it("the root package entry's next range matches package.json", () => {
    expect(packageLockJson.packages[""].dependencies.next).toBe(packageJson.dependencies.next);
  });

  it("the resolved next package version satisfies the caret range's base version", () => {
    const baseVersion = packageJson.dependencies.next.replace(/^\^/, "");
    expect(packageLockJson.packages["node_modules/next"].version).toBe(baseVersion);
  });

  it("the resolved next tarball URL matches the resolved version", () => {
    const resolvedVersion = packageLockJson.packages["node_modules/next"].version;
    expect(packageLockJson.packages["node_modules/next"].resolved).toContain(
      `next-${resolvedVersion}.tgz`
    );
  });
});

describe("package.json — regression: unrelated next-related pins untouched", () => {
  it("eslint-config-next remains pinned to an exact version (not a caret range)", () => {
    expect(packageJson.devDependencies["eslint-config-next"]).toBe("16.2.9");
  });
});