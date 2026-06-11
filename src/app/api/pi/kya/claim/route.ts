import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';

interface KyaClaimBody {
  username: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`kya-claim:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const { username } = body as KyaClaimBody;
  if (!username) {
    return apiError('VALIDATION_ERROR', 'username is required');
  }

  try {
    const walletAddress = `pi:${username}`;
    const existing = await prisma.user.findUnique({ where: { walletAddress } });

    if (existing) {
      return apiSuccess({
        userId: existing.id,
        walletAddress: existing.walletAddress,
        tier: existing.tier,
        xp: existing.xp,
      });
    }

    const user = await prisma.user.create({
      data: {
        walletAddress,
        piUsername: username,
        kycStatus: 'PENDING',
        kycProvider: 'pi_network',
        did: `did:axiom:${username}`,
        lastActive: new Date(),
      },
    });

    return apiSuccess({
      userId: user.id,
      walletAddress: user.walletAddress,
      kycStatus: user.kycStatus,
      did: user.did,
    }, 201);
  } catch (error) {
    console.error('[KYA-CLAIM] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to claim KYA');
  }
}
