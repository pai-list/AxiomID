import packageJson from "../../package.json";

describe("package.json — next dependency version range (PR change)", () => {
  it("uses a caret range for next instead of a pinned exact version", () => {
    expect(packageJson.dependencies.next).toMatch(/^\^16\./);
  });

  it("the caret range still targets the next 16.x major version", () => {
    expect(packageJson.dependencies.next).toMatch(/^\^16\./);
  });
});
