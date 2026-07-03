/**
 * @jest-environment node
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    skillVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { createVersion, getVersions, getVersion } from "@/lib/skill-versions";
import { prisma } from "@/lib/prisma";

const mockCreate = prisma.skillVersion.create as jest.Mock;
const mockFindMany = prisma.skillVersion.findMany as jest.Mock;
const mockFindUnique = prisma.skillVersion.findUnique as jest.Mock;

describe("Skill Versions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a new version", async () => {
    mockCreate.mockResolvedValue({ id: "v1", version: "1.0.0" });

    const version = await createVersion("skill-1", "1.0.0", "<skill/>", null, null, "Initial release");

    expect(version.version).toBe("1.0.0");
  });

  it("gets all versions for a skill", async () => {
    mockFindMany.mockResolvedValue([
      { version: "1.0.0" },
      { version: "1.1.0" },
    ]);

    const versions = await getVersions("skill-1");

    expect(versions).toHaveLength(2);
  });

  it("gets a specific version", async () => {
    mockFindUnique.mockResolvedValue({ version: "1.0.0", manifestMd: "<skill/>" });

    const version = await getVersion("skill-1", "1.0.0");

    expect(version?.version).toBe("1.0.0");
  });
});
