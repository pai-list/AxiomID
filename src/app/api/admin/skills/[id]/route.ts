import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { isAdmin } from "@/lib/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`admin-skills-id:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.", undefined, rateLimitHeaders(rateLimit));
  }

  if (!isAdmin(auth.user)) return apiError("FORBIDDEN", "Admin access required");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const { id } = await params;
  if (!id) {
    return apiError("VALIDATION_ERROR", "Moderation id is required");
  }

  const { action, reason, notes } = body as { action: string; reason?: string; notes?: string };

  if (!action) {
    return apiError("VALIDATION_ERROR", "action is required");
  }

  if (!["approve", "reject"].includes(action)) {
    return apiError("VALIDATION_ERROR", "action must be 'approve' or 'reject'");
  }

  try {
    const existing = await prisma.skillModeration.findUnique({ where: { id } });
    if (!existing) {
      return apiError("NOT_FOUND", "Moderation not found");
    }

    const moderation = await prisma.skillModeration.update({
      where: { id },
      data: {
        reviewerId: auth.user.id,
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reason,
        notes
      },
    });

    if (action === "approve") {
      await prisma.skill.update({
        where: { id: moderation.skillId },
        data: { status: "PUBLISHED", isPublished: true },
      });
    } else {
      await prisma.skill.update({
        where: { id: moderation.skillId },
        data: { status: "DRAFT", isPublished: false },
      });
    }

    return apiSuccess({ moderation });
  } catch (error) {
    logger.error("[ADMIN-SKILLS] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to process moderation");
  }
}
