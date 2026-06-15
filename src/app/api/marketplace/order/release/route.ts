import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";
import { OrderActionSchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

/**
 * Releases an escrowed payment after verifying authorization and request validity.
 *
 * @param req - The HTTP request containing the payment ID
 * @returns An API response indicating successful payment release or describing the error
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`order-release:${ip}`, RATE_LIMITS.payment);
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
    data: { status: "RELEASED" },
  });

  return apiSuccess({ status: "RELEASED" });
}
