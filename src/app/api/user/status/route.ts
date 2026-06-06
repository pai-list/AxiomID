import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatusSchema } from '@/lib/validators';
import { apiError, apiSuccess } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { calculateTier, getLevelProgress, getNextLevelXP } from '@/lib/tiers';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`user-status:${ip}`, RATE_LIMITS.anonymous);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ?? undefined;
  const walletAddress = searchParams.get('walletAddress') ?? undefined;

  const parsed = UserStatusSchema.safeParse({ userId, walletAddress });
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message, parsed.error.issues);
  }

  try {
    const where = parsed.data.userId
      ? { id: parsed.data.userId }
      : { walletAddress: parsed.data.walletAddress! };

    const user = await prisma.user.findUnique({
      where,
      include: {
        agent: {
          select: {
            id: true,
            publicId: true,
            name: true,
            status: true,
            mode: true,
            personaId: true,
          },
        },
        xpLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { actions: true, xpLedger: true },
        },
      },
    });

    if (!user) {
      return apiError('NOT_FOUND', 'User not found');
    }

    const tier = calculateTier(user.xp);
    const progress = getLevelProgress(user.xp, tier);
    const nextLevelXP = getNextLevelXP(tier);

    return apiSuccess({
      userId: user.id,
      walletAddress: user.walletAddress,
      piUid: user.piUid,
      piUsername: user.piUsername,
      did: user.did,
      kycStatus: user.kycStatus,
      tier,
      xp: user.xp,
      levelProgress: progress,
      nextLevelXP,
      agent: user.agent,
      recentLedger: user.xpLedger,
      stats: {
        totalActions: user._count.actions,
        totalLedgerEntries: user._count.xpLedger,
      },
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[USER-STATUS] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch user status');
  }
}
