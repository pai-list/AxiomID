import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { requireAuth } from '@/lib/auth-middleware';

/**
 * GET /api/spend-request/stream?agentId=X
 * SSE endpoint for agent polling.
 * Emits status_change events when SpendRequest status changes.
 * Emits heartbeat every 5s to keep connection alive.
 *
 * Ponytail: Polling-based SSE (no pub/sub infra), works on Vercel Edge.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`spend-request-stream:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return apiError('VALIDATION_ERROR', 'agentId query parameter is required');
  }

  // Verify agent exists and belongs to authenticated user
  const agent = await prisma.userAgent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return apiError('NOT_FOUND', 'Agent not found');
  }
  if (agent.userId !== auth.user.id) {
    return apiError('FORBIDDEN', 'Agent does not belong to authenticated user');
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastStatus = 'pending';
      let lastCheckedId = '';

      const interval = setInterval(async () => {
        try {
          const sr = await prisma.spendRequest.findFirst({
            where: {
              agentId,
              status: { not: 'pending' },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (sr && (sr.id !== lastCheckedId || sr.status !== lastStatus)) {
            lastCheckedId = sr.id;
            lastStatus = sr.status;

            const data = JSON.stringify({
              id: sr.id,
              status: sr.status,
              txid: sr.txid,
              paymentId: sr.paymentId,
              amount: sr.amount.toString(),
              currency: sr.currency,
            });

            controller.enqueue(
              encoder.encode(`event: status_change\ndata: ${data}\n\n`)
            );
          }
        } catch (err) {
          logger.error('[SSE-SPEND-REQUEST] Poll error:', err);
        }

        // Always send heartbeat
        try {
          controller.enqueue(
            encoder.encode(`event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`)
          );
        } catch {
          clearInterval(interval);
        }
      }, 5000);

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch { /* Already closed */ }
      });

      // Defensive cancel callback
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
