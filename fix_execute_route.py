import sys
content = open('src/app/api/skills/[slug]/execute/route.ts').read()

if 'import { requireAuth }' not in content:
    content = content.replace(
        "import { SlugParamSchema } from '@/lib/validators';",
        "import { SlugParamSchema } from '@/lib/validators';\nimport { requireAuth } from '@/lib/auth-middleware';"
    )

old_rate_limit = """  const rateLimit = await checkRateLimit(`skill-execute:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }"""

new_rate_limit = """  const rateLimit = await checkRateLimit(`skill-execute:${ip}`, RATE_LIMITS.authenticated);
  if (!rateLimit.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { user } = auth;"""

if old_rate_limit in content and 'const auth = await requireAuth(request);' not in content:
    content = content.replace(old_rate_limit, new_rate_limit)

old_skill_check = """    const skill = await prisma.skill.findUnique({ where: { slug } });
    if (!skill) {
      return apiError('NOT_FOUND', `Skill "${slug}" not found`);
    }"""

new_skill_check = """    const skill = await prisma.skill.findUnique({ where: { slug } });
    if (!skill) {
      return apiError('NOT_FOUND', `Skill "${slug}" not found`);
    }

    // Verify user has installed the skill
    const installation = await prisma.skillInstallation.findFirst({
      where: {
        skillId: skill.id,
        userId: user.id
      }
    });

    if (!installation && skill.authorId !== user.id) {
      return apiError('FORBIDDEN', 'You must install this skill before executing it');
    }"""

if old_skill_check in content and 'const installation = await prisma.skillInstallation.findFirst' not in content:
    content = content.replace(old_skill_check, new_skill_check)

old_exec_create = """    const execution = await prisma.skillExecution.create({
      data: {
        skillId: skill.id,
        success: success !== false,
        input: input ?? undefined,
        output: output ?? undefined,
        durationMs: typeof durationMs === 'number' ? durationMs : undefined,
        errorMessage: errorMessage || undefined,
      },
    });"""

new_exec_create = """    const execution = await prisma.skillExecution.create({
      data: {
        skillId: skill.id,
        userId: user.id,
        success: success !== false,
        input: input ?? undefined,
        output: output ?? undefined,
        durationMs: typeof durationMs === 'number' ? durationMs : undefined,
        errorMessage: errorMessage || undefined,
      },
    });"""

if old_exec_create in content and 'userId: user.id,' not in content:
    content = content.replace(old_exec_create, new_exec_create)

open('src/app/api/skills/[slug]/execute/route.ts', 'w').write(content)
