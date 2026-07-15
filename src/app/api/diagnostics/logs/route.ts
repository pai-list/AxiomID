import { getDiagnostics, clearDiagnostics } from "@/lib/diagnostics/capture";
import { logger } from "@/lib/logger";
import { apiError, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-middleware";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(`diagnostics:${ip}`, RATE_LIMITS.authenticated);
    if (!rateLimit.allowed) {
      return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
    }

    const entries = getDiagnostics(50);
    return Response.json({ count: entries.length, entries });
  } catch (err) {
    logger.error("[DIAGNOSTICS] Failed to get diagnostics logs", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(`diagnostics:${ip}`, RATE_LIMITS.authenticated);
    if (!rateLimit.allowed) {
      return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
    }

    clearDiagnostics();
    return Response.json({ ok: true, message: "Diagnostics cleared" });
  } catch (err) {
    logger.error("[DIAGNOSTICS] Failed to clear diagnostics logs", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
