import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SpendRequestActionSchema, SpendRequestIdSchema } from '@/lib/validators';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { requireAuth } from '@/lib/auth-middleware';
import { ACTIONS } from '@/lib/actions';
import { calculateActionHash, GENESIS_HASH } from '@/lib/trust-chain';

export const maxDuration = 30;

/**
 * PATCH /api/spend-request/[id] — User approves or rejects a spend request.
 * On approve: status → "approved", agent can trigger Pi.createPayment() on client.
 * On reject: status → "rejected", rejectionReason stored, TrustScore decays.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`spend-request-action:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // Validate the ID param
  const idParsed = SpendRequestIdSchema.safeParse({ id });
  if (!idParsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid spend request ID');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const parsed = SpendRequestActionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message, parsed.error.issues);
  }

  const { status, rejectionReason, paymentId } = parsed.data;

  try {
    const spendRequest = await prisma.spendRequest.findUnique({ where: { id } });
    if (!spendRequest) {
      return apiError('NOT_FOUND', 'Spend request not found');
    }
    if (spendRequest.userId !== auth.user.id) {
      return apiError('FORBIDDEN', 'Spend request does not belong to authenticated user');
    }

    // State machine: pending → approved/rejected, approved → completed
    if (status === 'completed') {
      if (spendRequest.status !== 'approved') {
        return apiError('CONFLICT', 'Spend request must be approved before completion');
      }
    } else {
      if (spendRequest.status !== 'pending') {
        return apiError('CONFLICT', `Spend request is already ${spendRequest.status}`);
      }
    }

    if (new Date() > spendRequest.expiresAt) {
      await prisma.spendRequest.update({ where: { id }, data: { status: 'expired' } });
      return apiError('NOT_FOUND', 'Spend request has expired');
    }

    const updated = await prisma.spendRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason || null : null,
        paymentId: status === 'completed' ? paymentId || null : undefined,
      },
    });

    // Record TrustChain event
    const actionKey = status === 'approved'
      ? 'SPEND_REQUEST_APPROVED'
      : status === 'rejected'
        ? 'SPEND_REQUEST_REJECTED'
        : status === 'completed'
          ? 'SPEND_REQUEST_PAID'
          : 'SPEND_REQUEST_EXPIRED';
    const actionDef = ACTIONS[actionKey];

    if (actionDef) {
      const lastAction = await prisma.action.findFirst({
        where: { userId: auth.user.id },
        orderBy: { timestamp: 'desc' },
      });
      const parentHash = lastAction?.hash || GENESIS_HASH;

      const hash = calculateActionHash(parentHash, {
        type: actionDef.id,
        xp: actionDef.xp,
        metadata: JSON.stringify({ spendRequestId: id, agentId: spendRequest.agentId }),
        userId: auth.user.id,
        timestamp: new Date(),
      });

      await prisma.action.create({
        data: {
          userId: auth.user.id,
          type: actionDef.id,
          xp: actionDef.xp,
          metadata: JSON.stringify({ spendRequestId: id, agentId: spendRequest.agentId }),
          hash,
          parentHash,
        },
      });
    }

    logger.info('[SPEND-REQUEST] Updated', { id, status, agentId: spendRequest.agentId });

    return apiSuccess({
      id: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    logger.error('[SPEND-REQUEST] Action error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to update spend request');
  }
}

/**
 * GET /api/spend-request/[id] — Get a single spend request by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`spend-request-get:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const spendRequest = await prisma.spendRequest.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, avatarUrl: true, publicId: true },
        },
      },
    });

    if (!spendRequest) {
      return apiError('NOT_FOUND', 'Spend request not found');
    }
    if (spendRequest.userId !== auth.user.id) {
      return apiError('FORBIDDEN', 'Spend request does not belong to authenticated user');
    }

    return apiSuccess({
      id: spendRequest.id,
      amount: spendRequest.amount,
      currency: spendRequest.currency,
      description: spendRequest.description,
      context: spendRequest.context,
      items: spendRequest.items,
      status: spendRequest.status,
      rejectionReason: spendRequest.rejectionReason,
      paymentId: spendRequest.paymentId,
      txid: spendRequest.txid,
      createdAt: spendRequest.createdAt,
      expiresAt: spendRequest.expiresAt,
      agent: spendRequest.agent,
    });
  } catch (error) {
    logger.error('[SPEND-REQUEST] Get error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get spend request');
  }
}
