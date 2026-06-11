import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';

interface AgentMainBody {
  walletAddress: string;
  action: string;
  params?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`agent-main:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const { walletAddress, action, params } = body as AgentMainBody;
  if (!walletAddress || !action) {
    return apiError('VALIDATION_ERROR', 'walletAddress and action are required');
  }

  try {
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return apiError('NOT_FOUND', 'User not found');
    }

    const agent = await prisma.userAgent.findUnique({ where: { userId: user.id } });
    if (!agent) {
      return apiError('NOT_FOUND', 'No agent found. Create one via POST /api/agent');
    }

    if (agent.status !== 'ACTIVE') {
      return apiError('FORBIDDEN', 'Agent is not active. Activate via POST /api/agent/activate');
    }

    const updatedAgent = await prisma.userAgent.update({
      where: { id: agent.id },
      data: { lastActive: new Date() },
    });

    await prisma.agentLog.create({
      data: {
        userId: user.id,
        agentId: agent.id,
        level: 'info',
        source: 'agent',
        message: `Executed action: ${action}`,
        metadata: params ? JSON.stringify(params) : null,
      },
    });

    return apiSuccess({
      agentId: agent.id,
      publicId: agent.publicId,
      status: updatedAgent.status,
      action,
      result: `Action '${action}' dispatched to agent '${agent.name}'`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AGENT-MAIN] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to execute agent action');
  }
}
