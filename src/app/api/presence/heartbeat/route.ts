import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from "@/lib/ip";
import { PresenceHeartbeatSchema } from "@/lib/validators";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`heartbeat:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = PresenceHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { agentId } = parsed.data;

  // Forward to Cloudflare Durable Object
  const backendUrl = process.env.CLOUDFLARE_BACKEND_URL;
  const sharedSecret = process.env.SHARED_SECRET_TOKEN_VERCEL_CF;

  if (!backendUrl || !sharedSecret) {
    return apiError("INTERNAL_ERROR", "Backend configuration missing");
  }

  try {
    const response = await fetch(`${backendUrl}/heartbeat?agentId=${agentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shared-Secret": sharedSecret,
      },
    });

    if (!response.ok) {
      return apiError("INTERNAL_ERROR", "Failed to update presence");
    }

    return apiSuccess({ status: "OK" });
  } catch (error) {
    logger.error("[HEARTBEAT] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to update presence");
  }
}
