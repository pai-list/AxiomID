import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { isAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`admin-skills:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.", undefined, rateLimitHeaders(rateLimit));
  }

  if (!isAdmin(auth.user)) return apiError("FORBIDDEN", "Admin access required");

  try {
    const moderations = await prisma.skillModeration.findMany({
      where: { status: "PENDING" },
      include: { skill: true },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({ moderations });
  } catch (error) {
    logger.error("[ADMIN-SKILLS] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch moderations");
  }
}
