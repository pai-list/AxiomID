import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { AgentIdentitySchema } from "@/lib/validators";
import { createIdentityAssertion } from "@/lib/auth-tokens";
import { createClaimToken } from "@/lib/claim-ceremony";
import { logger } from "@/lib/logger";

const DEFAULT_SCOPES = ["api.read", "api.write"];

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`agent-identity:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.", undefined, rateLimitHeaders(rateLimit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = AgentIdentitySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  try {
    if (parsed.data.type === "identity_assertion") {
      const did = "did:axiom:axiomid.app:pi:extracted-from-jwt";
      const identityAssertion = await createIdentityAssertion(did, DEFAULT_SCOPES);

      return apiSuccess({
        identity_assertion: identityAssertion,
        scopes: DEFAULT_SCOPES,
      });
    }

    const claim = createClaimToken();

    return apiSuccess({
      claim_token: claim.token,
      claim: {
        user_code: claim.userCode,
        verification_uri: claim.verificationUri,
        expires_in: Math.floor((claim.expiresAt - Date.now()) / 1000),
      },
    });
  } catch (error) {
    logger.error("[AGENT-IDENTITY] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to process agent identity");
  }
}
