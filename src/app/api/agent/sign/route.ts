import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { AgentSignSchema } from "@/lib/validators";
import { signPayloadWithAgentKey, deriveSovereignAgentKeypair, ROOT_AGENT_ID } from "@/lib/sovereign-keys";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

/**
 * Signs an authenticated agent payload.
 *
 * @param request - The HTTP request containing the DID and payload to sign
 * @returns A JSON response with the signature, DID, and key version
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`agent-sign:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = AgentSignSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  try {
    const didParts = parsed.data.did.split(":");
    const uid = didParts[didParts.length - 1];

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { did: parsed.data.did },
          { piUid: uid }
        ]
      },
      select: { id: true, piUid: true }
    });

    const signingUid = user ? (user.piUid || user.id) : uid;

    const keys = deriveSovereignAgentKeypair(signingUid, ROOT_AGENT_ID);
    const signature = signPayloadWithAgentKey(parsed.data.payload, keys.privateKey);

    return apiSuccess({
      signature,
      did: parsed.data.did,
      keyVersion: 1,
    });
  } catch (error) {
    logger.error("[AGENT-SIGN] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to sign payload");
  }
}
