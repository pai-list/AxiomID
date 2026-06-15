import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";
import { OrderActionSchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

/**
 * Refunds an escrowed payment from an authenticated user.
 *
 * Validates the request, authenticates the user, verifies they own the payment, and updates the payment status to refunded. Rate limiting is enforced per client IP.
 *
 * @returns An API response object containing the refund status on success, or error details on failure.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`order-refund:${ip}`, RATE_LIMITS.payment);
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

  await prisma.piPayment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED" },
  });

  return apiSuccess({ status: "REFUNDED" });
}
