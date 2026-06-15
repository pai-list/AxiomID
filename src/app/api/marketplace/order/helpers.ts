import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticatedUser } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { OrderActionSchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

export interface EscrowActionContext {
  user: AuthenticatedUser;
  paymentId: string;
}

/**
 * Shared validation for escrow payment actions (refund, release).
 * Handles rate limiting, auth, JSON parsing, schema validation, and payment verification.
 *
 * @returns EscrowActionContext on success, or a NextResponse error if any check fails.
 */
export async function validateEscrowAction(
  req: NextRequest,
  rateLimitKey: string
): Promise<NextResponse | EscrowActionContext> {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`${rateLimitKey}:${ip}`, RATE_LIMITS.payment);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.");
  }

  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = OrderActionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { paymentId } = parsed.data;

  const payment = await prisma.piPayment.findUnique({ where: { id: paymentId } });
  if (!payment) return apiError("NOT_FOUND", "Payment not found");
  if (payment.userId !== auth.user.id) return apiError("FORBIDDEN", "Unauthorized");
  if (payment.status !== "ESCROWED") return apiError("CONFLICT", "Payment not in escrow");

  return { user: auth.user, paymentId };
}