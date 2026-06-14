import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { skillId, agentId, amount, paymentId } = body;

  if (!skillId || !agentId || !amount || !paymentId) {
    return apiError("VALIDATION_ERROR", "Missing required fields");
  }

  // Check skill
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) return apiError("NOT_FOUND", "Skill not found");

  // Create escrow payment
  const payment = await prisma.piPayment.create({
    data: {
      userId: auth.user.id,
      amount,
      paymentId,
      metadata: JSON.stringify({ skillId, agentId, purpose: "marketplace_purchase" }),
      status: "ESCROWED",
    },
  });

  return apiSuccess({ paymentId: payment.id });
}
