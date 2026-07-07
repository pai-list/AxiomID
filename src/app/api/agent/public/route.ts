import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

const PublicAgentQuerySchema = z.object({
  username: z.string().min(1, "Username required").max(63).regex(/^[a-zA-Z0-9_-]+$/, "Invalid username format"),
});

/**
 * GET /api/agent/public?username=xxx — Public agent data endpoint.
 * Returns minimal public profile for agent subdomain pages.
 * No auth required.
 */
export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`agent-public:${ip}`, RATE_LIMITS.public);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
    }

    const { searchParams } = new URL(request.url);
    const parsed = PublicAgentQuerySchema.safeParse({ username: searchParams.get("username") });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { username } = parsed.data;

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { piUsername: username.toLowerCase() },
          { walletAddress: username },
          { subdomain: username.toLowerCase() },
        ],
      },
      select: {
        id: true,
        piUsername: true,
        walletAddress: true,
        tier: true,
        xp: true,
        kycStatus: true,
        did: true,
        passportUrl: true,
        createdAt: true,
        agent: {
          select: {
            name: true,
            status: true,
            lastActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: user.piUsername,
      walletAddress: user.walletAddress
        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        : null,
      tier: user.tier,
      xp: user.xp,
      verified: user.kycStatus === "VERIFIED",
      did: user.did,
      agent: user.agent
        ? {
            name: user.agent.name,
            status: user.agent.status,
            lastActive: user.agent.lastActive?.toISOString() ?? null,
          }
        : null,
      memberSince: user.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to fetch public agent data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
