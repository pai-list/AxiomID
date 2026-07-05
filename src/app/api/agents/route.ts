import { NextRequest } from "next/server";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
\n\nExtracted the three wizard steps (Connect Wallet, Verify, Activate Agent) \nfrom `src/app/claim/page.tsx` into their own dedicated components under \n`src/components/claim/`:\n- `ConnectStep.tsx`\n- `VerifyStep.tsx`\n- `DeployStep.tsx`\n\nThis addresses an overly long file issue (reducing it from ~820 lines down to 476 lines), significantly improving readability and maintainability of the ClaimPage component. All functionality remains identical and all tests and typescript checks continue to pass successfully. \n\nAlso addressed an unused variable lint warning in `src/app/api/agents/route.ts`.)
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

/**
 * Returns all agents for the authenticated user.
 *
 * @param request - The incoming HTTP request
 * @returns An HTTP response with the user's agents, or an error response on failure.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const rateLimit = await checkRateLimit(`agents-list:${auth.user.id}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  try {
    const agents = await prisma.userAgent.findMany({
      where: { userId: auth.user.id },
      select: {
        id: true,
        publicId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true},
      orderBy: { createdAt: "desc" }});

    return apiSuccess({ agents });
  } catch (error) {
    logger.error("[AGENTS-LIST] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch agents");
  }
}
