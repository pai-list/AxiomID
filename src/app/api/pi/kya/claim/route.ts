import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { requireAuth } from '@/lib/auth-middleware';
import { createPiDid } from '@/lib/did';

/**
 * Process a KYA claim request for an authenticated Pi Network user.
 *
 * The user's piUsername (from Pi auth) is used for identity — no client-supplied
 * data is accepted for this field. If the user has completed a Pi payment (which
 * requires Pi KYC), kycStatus is set to VERIFIED. Otherwise it stays PENDING
 * until a payment completes (see complete/route.ts which upgrades to VERIFIED).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`kya-claim:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const existing = await prisma.user.findUnique({ where: { piUid: user.piUid } });

    if (!existing) {
      return apiError('NOT_FOUND', 'User must authenticate first via POST /api/auth/pi before claiming KYA');
    }

    // A completed Pi payment proves the user is KYC'd on Pi Network (Pi only
    // allows payments from KYC-verified accounts). Upgrade kycStatus accordingly.
    const completedPayment = await prisma.piPayment.findFirst({
      where: { userId: existing.id, status: 'RELEASED' },
      select: { id: true },
    });

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        // Only use the server-verified piUsername from auth, never from client
        piUsername: existing.piUsername || user.piUsername,
        kycStatus: completedPayment ? 'VERIFIED' : 'PENDING',
        kycProvider: 'pi_network',
        did: existing.did || createPiDid(existing.piUid || user.piUid),
      },
    });

    return apiSuccess({
      userId: updated.id,
      walletAddress: updated.walletAddress,
      kycStatus: updated.kycStatus,
      did: updated.did,
      tier: updated.tier,
      xp: updated.xp,
    });
  } catch (error) {
    logger.error('[KYA-CLAIM] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to claim KYA');
  }
}
