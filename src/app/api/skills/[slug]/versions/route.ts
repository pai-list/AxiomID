import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getVersions } from "@/lib/skill-versions";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`skill-versions:${ip}`, RATE_LIMITS.anonymous);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.", undefined, rateLimitHeaders(rateLimit));
  }

  const { slug } = await params;

  if (!slug) {
     return apiError("VALIDATION_ERROR", "Slug is required");
  }

  try {
    const skill = await prisma.skill.findUnique({ where: { slug } });
    if (!skill) {
      return apiError("NOT_FOUND", "Skill not found");
    }

    const versions = await getVersions(skill.id);
    return apiSuccess({ versions, total: versions.length });
  } catch (error) {
    logger.error("[SKILL-VERSIONS] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch versions");
  }
}
