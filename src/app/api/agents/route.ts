import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

/**
 * Returns all agents for the authenticated user.
 *
 * @param request - The incoming HTTP request
 * @returns An HTTP response with the user's agents, or an error response on failure.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`agents-list:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const agents = await prisma.userAgent.findMany({
      where: { userId: auth.user.id },
      select: {
        id: true,
        publicId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ agents });
  } catch (error) {
    logger.error("[AGENTS-LIST] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch agents");
  }
}
