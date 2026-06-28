import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { verifyVcOnChain } from "@/lib/stellar-anchoring";
import { logger } from "@/lib/logger";
import { z } from "zod";

const VerifyRequestSchema = z.object({
  signedVc: z.record(z.string(), z.unknown()),
  stellarTxId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`vc-verify:${ip}`, RATE_LIMITS.public);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests", undefined, rateLimitHeaders(rateLimit));
  }

  try {
    const body = await request.json();
    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
    }

    const { signedVc, stellarTxId } = parsed.data;
    const result = await verifyVcOnChain(signedVc, stellarTxId);

    return apiSuccess(result);
  } catch (err) {
    logger.error("VC on-chain verification failed", { error: err });
    return apiError("INTERNAL_ERROR", "Failed to verify VC on Stellar");
  }
}