import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";
import { validateEscrowAction } from "../helpers";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const result = await validateEscrowAction(req, "order-release");
  if (!("paymentId" in result)) return result;

  const { paymentId } = result;

  try {
    await prisma.piPayment.update({
      where: { id: paymentId },
      data: { status: "RELEASED" },
    });

    return apiSuccess({ status: "RELEASED" });
  } catch (error) {
    logger.error("[ORDER-RELEASE] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to release payment");
  }
}
