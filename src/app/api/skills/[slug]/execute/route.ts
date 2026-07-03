import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { requireAuth } from '@/lib/auth-middleware';
import { SlugParamSchema } from '@/lib/validators';
import { requireAuth } from '@/lib/auth-middleware';

/**
 * POST /api/skills/[slug]/execute — Record a skill execution and update stats.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const parsedParams = SlugParamSchema.safeParse({ slug });
  if (!parsedParams.success) {
    return apiError('VALIDATION_ERROR', parsedParams.error.issues[0].message, parsedParams.error.issues);
  }

  
  
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`skill-execute:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const { success, input, output, durationMs, errorMessage } = body as {
    success?: boolean;
    input?: unknown;
    output?: unknown;
    durationMs?: number;
    errorMessage?: string;
  };

  try {
    const skill = await prisma.skill.findUnique({ where: { slug } });
    if (!skill) {
      return apiError('NOT_FOUND', `Skill "${slug}" not found`);
    }

    // Verify user has installed the skill
    // Verify user has installed the skill via their agent
    const installation = await prisma.skillInstallation.findFirst({
      where: {
        skillId: skill.id,
        agent: { userId: user.id }
      }
    });

    if (!installation && skill.authorId !== user.id) {
      return apiError('FORBIDDEN', 'You must install this skill before executing it');
    }

    // Find user agent to associate with execution
    const userAgent = await prisma.userAgent.findUnique({
      where: { userId: user.id }
    });

    const execution = await prisma.skillExecution.create({
      data: {
        skillId: skill.id,
        agentId: userAgent?.id || null,
        success: success !== false,
        input: input ?? undefined,
        output: output ?? undefined,
        durationMs: typeof durationMs === 'number' ? durationMs : undefined,
        errorMessage: errorMessage || undefined,
      },
    });

    return apiSuccess({
      executionId: execution.id,
      success: execution.success,
    }, 201);
  } catch (error) {
    logger.error('[SKILL-EXECUTE] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to record execution');
  }
}
