import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { calculateTrustScore } from '@/lib/trust';

/**
 * Handle GET /status requests and return network metadata and aggregate statistics.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`status:${ip}`, RATE_LIMITS.anonymous);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  try {
    const results = await Promise.allSettled([
      prisma.user.count(),
      prisma.userAgent.count(),
      prisma.userAgent.count({ where: { status: 'ACTIVE' } }),
      prisma.piPayment.count(),
      prisma.user.aggregate({ _sum: { xp: true } }),
      prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({ where: { kycStatus: 'VERIFIED' } }),
      prisma.user.findMany({
        take: 100,
        select: {
          xp: true,
          stamps: {
            select: { id: true }
          }
        }
      })
    ]);

    const getValue = <T>(index: number, fallback: T): T => {
      const res = results[index];
      return res.status === 'fulfilled' ? (res.value as T) : fallback;
    };

    const userCount = getValue(0, 0);
    const agentCount = getValue(1, 0);
    const activeAgentCount = getValue(2, 0);
    const paymentCount = getValue(3, 0);
    const xpSum = getValue(4, { _sum: { xp: 0 } });
    const activeUsersCount = getValue(5, 0);
    const verifiedUsersCount = getValue(6, 0);
    const usersSample = getValue(7, [] as { xp: number; stamps: { id: string }[] }[]);

    let totalTrustScore = 0;
    usersSample.forEach(u => {
      try {
        totalTrustScore += calculateTrustScore(u.xp || 0, u.stamps?.length || 0);
      } catch {
        // Ignore individual errors in sample
      }
    });

    const averageTrustScore = usersSample.length > 0 ? Math.round(totalTrustScore / usersSample.length) : 0;
    const verificationRate = userCount > 0 ? Math.round((verifiedUsersCount / userCount) * 100) : 0;

    return apiSuccess({
      network: 'axiomid',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      stats: {
        registeredUsers: userCount,
        totalAgents: agentCount,
        activeAgents: activeAgentCount,
        totalPayments: paymentCount,
        totalXpEarned: xpSum?._sum?.xp ?? 0,
        activeUsers: Math.max(1, activeUsersCount),
        averageTrustScore,
        verificationRate,
      },
    });
  } catch (error) {
    logger.error('[STATUS] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch network status');
  }
}
