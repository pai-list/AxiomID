import { NextRequest } from "next/server";
import { captureDiagnostic } from "@/lib/diagnostics/capture";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { z } from "zod";

const CaptureSchema = z.object({
  level: z.enum(["error", "warn", "info"]).default("error"),
  source: z.enum(["pi-sdk", "api", "auth", "payment", "client", "network"]),
  message: z.string().min(1, "message is required").max(5000),
  details: z.record(z.string(), z.unknown()).optional(),
  url: z.string().max(2000).optional(),
});

/** ponytail: no requireAuth — diagnostics must capture pre-auth errors (Pi.init, Pi.authenticate failures) */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`diagnostics-capture:${ip}`, RATE_LIMITS.anonymous);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  try {
    const entry = captureDiagnostic({
      ...parsed.data,
      url: parsed.data.url || req.headers.get("referer") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return apiSuccess({ ok: true, id: entry.id });
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to capture diagnostic");
  }
}
