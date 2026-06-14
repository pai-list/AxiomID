import { prisma } from "@/lib/prisma";

/**
 * Compute the delegated trust score for a given DID.
 * 
 * @param did - The DID to get the score for
 * @returns A numeric delegated trust score
 */
export async function getDelegatedTrustScore(did: string): Promise<number> {
  const delegations = await prisma.delegatedTrust.findMany({
    where: { toDid: did },
    select: { weight: true },
  });
  
  const score = delegations.reduce((acc, d) => acc + d.weight, 0);
  // Cap at 100
  return Math.min(100, score);
}

/**
 * Add a trust delegation record.
 */
export async function addDelegation(fromDid: string, toDid: string, weight: number) {
  return await prisma.delegatedTrust.upsert({
    where: { delegation_unique: { fromDid, toDid } },
    update: { weight },
    create: { fromDid, toDid, weight },
  });
}
