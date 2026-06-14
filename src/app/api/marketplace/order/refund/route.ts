import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { paymentId } = await req.json();

  if (!paymentId) {
    return apiError("VALIDATION_ERROR", "Missing paymentId");
  }

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
