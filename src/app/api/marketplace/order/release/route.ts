import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/errors";
import { validateEscrowAction } from "../helpers";

/**
 * Transitions a payment from escrow to released status after verifying the requester's authorization and rate limit.
 *
 * @returns A response indicating successful release with the updated payment status, or an error response
 * if rate-limited, unauthenticated, the payment is not found, the user is unauthorized to modify it,
 * or the payment is not in escrow.
 */
export async function POST(req: NextRequest) {
  const result = await validateEscrowAction(req, "order-release");
  if (!("paymentId" in result)) return result;

  const { paymentId } = result;

  await prisma.piPayment.update({
    where: { id: paymentId },

  });

  return apiSuccess({ status: "RELEASED" });
}
