import { prisma } from "@/lib/prisma";

export async function resolveDid(did: string) {
  const user = await prisma.user.findFirst({
    where: { did: did },
    select: { id: true, did: true, piUid: true, kycStatus: true },
  });
  
  if (!user || !user.did) {
    return null;
  }
  
  return user;
}
