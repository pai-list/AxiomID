import { prisma } from "@/lib/prisma";

export async function createVersion(
  skillId: string,
  version: string,
  manifestMd: string,
  agentScript: string | null,
  testSuite: string | null,
  changelog?: string
) {
  return prisma.skillVersion.create({
    data: {
      skillId,
      version,
      manifestMd,
      agentScript,
      testSuite,
      changelog,
    },
  });
}

export async function getVersions(skillId: string) {
  return prisma.skillVersion.findMany({
    where: { skillId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVersion(skillId: string, version: string) {
  return prisma.skillVersion.findUnique({
    where: { skill_version_unique: { skillId, version } },
  });
}
