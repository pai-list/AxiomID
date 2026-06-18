import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limiter';
import { apiError, apiSuccess, rateLimitHeaders } from '@/lib/errors';
import { getClientIp } from '@/lib/ip';
import { queryPerplexity } from '@/lib/agents/perplexity';
import { logger } from '@/lib/logger';

const HARVEST_RATE_LIMIT = { windowMs: 60_000, maxRequests: 5 };

const harvestSchema = z.object({
  query: z.string().min(3).max(500),
  maxTokens: z.number().int().min(1).max(2048).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rateLimit = await checkRateLimit(`harvest:${ip}`, HARVEST_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Please try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const validation = harvestSchema.safeParse(body);
  if (!validation.success) {
    return apiError('VALIDATION_ERROR', validation.error.issues[0].message, validation.error.issues);
  }

  try {
    const { query, maxTokens, temperature } = validation.data;
    const result = await queryPerplexity(query, { maxTokens, temperature });

    return apiSuccess({
      query,
      result: result.content,
      citations: result.citations,
    });
  } catch (error: unknown) {
    logger.error('[HARVEST_ROUTE] Error:', error);
    return apiError('INTERNAL_ERROR', 'Harvest request failed');
  }
}
