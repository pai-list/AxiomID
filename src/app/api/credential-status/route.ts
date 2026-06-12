import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get("credentialId");
  const subjectId = searchParams.get("subjectId");

  if (!credentialId && !subjectId) {
    return apiError("VALIDATION_ERROR", "credentialId or subjectId required");
  }

  try {
    const did = (credentialId || subjectId || "").replace(/^did:axiom:user-/, "");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(did)) {
      return apiError("VALIDATION_ERROR", "Invalid DID format or UUID");
    }

    const user = await prisma.user.findUnique({ where: { id: did } });
    if (!user) {
      return apiSuccess({ revoked: true, reason: "subject_not_found" }, 200);
    }

    const revoked = user.kycStatus === "REJECTED";
    return apiSuccess({
      revoked,
      status: revoked ? "REVOKED" : "VALID",
      subjectId: user.did || `did:axiom:user-${user.id}`,
      lastUpdated: user.updatedAt.toISOString(),
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to check credential status");
  }
}
