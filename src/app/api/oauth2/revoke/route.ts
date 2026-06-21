import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { TokenRevocationSchema } from "@/lib/validators";
import { revokeToken } from "@/lib/revocation";
import { logger } from "@/lib/logger";

/**
 * Processes an OAuth2 token revocation request.
 *
 * Validates the request body and adds the token to the revocation list.
 *
 * @param request - The incoming HTTP request with the token to revoke
 * @returns An API response with a success flag or error details
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`oauth2-revoke:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = TokenRevocationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  try {
    revokeToken(parsed.data.token);
    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("[OAUTH2-REVOKE] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to revoke token");
  }
}
