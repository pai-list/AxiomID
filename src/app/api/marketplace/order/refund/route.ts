import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/errors";
import { validateEscrowAction } from "../helpers";

/**
 * Refunds an escrowed payment for the authenticated user.
 *
 * Rate limits by client IP. Verifies the payment belongs to the authenticated user and is in escrow
 * before marking it as `REFUNDED`.
 *
 * @returns An API response with the refunded payment status or an error.
 */
export async function POST(req: NextRequest) {
  const result = await validateEscrowAction(req, "order-refund");
  if (!("paymentId" in result)) return result;

  const { paymentId } = result;

  await prisma.piPayment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED" },
  });

  return apiSuccess({ status: "REFUNDED" });
}
