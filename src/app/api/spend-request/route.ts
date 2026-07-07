import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SpendRequestCreateSchema, SpendRequestQuerySchema } from '@/lib/validators';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { requireAuth } from '@/lib/auth-middleware';

export const maxDuration = 30;

const SPEND_REQUEST_EXPIRY_HOURS = 12;

/**
 * POST /api/spend-request — Agent creates a spend request.
 * The user must approve it before Pi payment is triggered.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`spend-request-create:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const parsed = SpendRequestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message, parsed.error.issues);
  }

  const { agentId, amount, currency, description, context, items } = parsed.data;

  try {
    // Verify agent exists and belongs to authenticated user
    const agent = await prisma.userAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found');
    }
    if (agent.userId !== auth.user.id) {
      return apiError('FORBIDDEN', 'Agent does not belong to authenticated user');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SPEND_REQUEST_EXPIRY_HOURS);

    const spendRequest = await prisma.spendRequest.create({
      data: {
        agentId,
        userId: auth.user.id,
        amount,
        currency: currency || 'PI',
        description,
        context,
        items: items ? JSON.stringify(items) : undefined,
        expiresAt,
      },
    });

    logger.info('[SPEND-REQUEST] Created', { id: spendRequest.id, agentId, amount });

    return apiSuccess({
      id: spendRequest.id,
      status: spendRequest.status,
      expiresAt: spendRequest.expiresAt,
      amount: spendRequest.amount,
      description: spendRequest.description,
    }, 201);
  } catch (error) {
    logger.error('[SPEND-REQUEST] Create error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to create spend request');
  }
}

/**
 * GET /api/spend-request — List spend requests for the authenticated user.
 * Query params: status, agentId
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`spend-request-list:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = SpendRequestQuerySchema.safeParse({
    status: searchParams.get('status') || undefined,
    agentId: searchParams.get('agentId') || undefined,
  });

  if (!query.success) {
    return apiError('VALIDATION_ERROR', query.error.issues[0].message, query.error.issues);
  }

  const { status, agentId } = query.data;

  try {
    const where: Record<string, unknown> = { userId: auth.user.id };
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    const requests = await prisma.spendRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        agent: {
          select: { id: true, name: true, avatarUrl: true, publicId: true },
        },
      },
    });

    return apiSuccess({ requests, count: requests.length });
  } catch (error) {
    logger.error('[SPEND-REQUEST] List error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to list spend requests');
  }
}
