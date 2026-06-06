import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WalletConnectSchema } from '@/lib/validators';
import { apiError, apiSuccess } from '@/lib/errors';
import { verifyState } from '@/lib/oauth-state';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { calculateTier } from '@/lib/tiers';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`wallet-connect:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many connection requests. Try again later.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const parsed = WalletConnectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message, parsed.error.issues);
  }

  const { walletAddress, state } = parsed.data;

  const verifiedAddress = verifyState(state);
  if (!verifiedAddress) {
    return apiError('UNAUTHORIZED', 'Invalid or expired state token');
  }

  if (verifiedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return apiError('FORBIDDEN', 'State token does not match wallet address');
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastActive: new Date() },
      });
    } else {
      user = await prisma.user.create({
        data: {
          walletAddress,
          tier: 'Visitor',
          xp: 0,
        },
      });
    }

    const tier = calculateTier(user.xp);

    return apiSuccess({
      userId: user.id,
      walletAddress: user.walletAddress,
      tier,
      xp: user.xp,
      did: user.did,
      kycStatus: user.kycStatus,
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error('[WALLET-CONNECT] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to connect wallet');
  }
}
