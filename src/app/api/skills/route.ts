import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip';
import { Prisma, SkillTier } from '@prisma/client';

/**
 * GET /api/skills — List published skills from the Agentic Marketplace.
 * Returns skills filtered by tier, sorted by install count and rating.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`skills-list:${ip}`, RATE_LIMITS.anonymous);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');
  const search = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const where: Prisma.SkillWhereInput = {
      isPublished: true,
      status: 'PUBLISHED',
      ...(tier ? { tier: tier as SkillTier } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,

          id: true,
          slug: true,
          name: true,
          description: true,
          tier: true,
          pricePi: true,
          version: true,
          installCount: true,
          avgRating: true,
          ratingCount: true,
          authorId: true,
          createdAt: true,
        },
        orderBy: [
          { installCount: 'desc' },
          { avgRating: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.skill.count({ where }),
    ]);

    return apiSuccess({
      skills,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    logger.error('[SKILLS-LIST] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to list skills');
  }
}

/**
 * POST /api/skills — Publish a new skill to the Agentic Marketplace.
 * Requires authentication. Creates the skill with manifest, agent script, and test suite.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`skills-create:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  if (!body || typeof body !== 'object') {
    return apiError('VALIDATION_ERROR', 'Request body required');
  }

  const {
    slug,
    name,
    description,
    manifestMd,
    agentScript,
    testSuite,
    tier,
    pricePi,
    version,
  } = body as Record<string, unknown>;

  // Validation
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return apiError('VALIDATION_ERROR', 'slug must be lowercase alphanumeric with hyphens');
  }
  if (!name || typeof name !== 'string') {
    return apiError('VALIDATION_ERROR', 'name is required');
  }
  if (!manifestMd || typeof manifestMd !== 'string') {
    return apiError('VALIDATION_ERROR', 'manifestMd is required — the full SKILL.md content');
  }

  try {
    // Check slug uniqueness
    const existing = await prisma.skill.findUnique({ where: { slug } });
    if (existing) {
      return apiError('CONFLICT', `Skill with slug "${slug}" already exists`);
    }

    const skill = await prisma.skill.create({
      data: {
        slug,
        name: name.slice(0, 200),
        description: (description as string)?.slice(0, 1000) || null,
        manifestMd,
        agentScript: (agentScript as string) || null,
        testSuite: (testSuite as string) || null,
        tier: (tier as SkillTier) || 'BASIC_TOOL',
        pricePi: typeof pricePi === 'number' ? pricePi : 0,
        version: (version as string) || '1.0.0',
        status: 'PUBLISHED',
        isPublished: true,
      },
    });

    return apiSuccess({
      skillId: skill.id,
      slug: skill.slug,
      name: skill.name,
      tier: skill.tier,
      version: skill.version,
      status: skill.status,
    }, 201);
  } catch (error) {
    logger.error('[SKILLS-CREATE] Database error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to create skill');
  }
}
