import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";
import { validateEscrowAction } from "../helpers";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const result = await validateEscrowAction(req, "order-refund");
  if (!("paymentId" in result)) return result;

  const { paymentId } = result;

  try {
    await prisma.piPayment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
    });

    return apiSuccess({ status: "REFUNDED" });
  } catch (error) {
    logger.error("[ORDER-REFUND] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to refund payment");
  }
}
