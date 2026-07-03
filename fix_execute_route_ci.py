import sys
content = open('src/app/api/skills/[slug]/execute/route.ts').read()

# 1. Update installation check
old_inst = """    const installation = await prisma.skillInstallation.findFirst({
      where: {
        skillId: skill.id,
        userId: user.id
      }
    });"""
new_inst = """    // Verify user has installed the skill via their agent
    const installation = await prisma.skillInstallation.findFirst({
      where: {
        skillId: skill.id,
        agent: { userId: user.id }
      }
    });"""
content = content.replace(old_inst, new_inst)

# 2. Update execution creation (need to find agentId first or use nested)
old_exec = """    const execution = await prisma.skillExecution.create({
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

new_exec = """    // Find user agent to associate with execution
    const userAgent = await prisma.userAgent.findUnique({
      where: { userId: user.id }
    });

    const execution = await prisma.skillExecution.create({
      data: {
        skillId: skill.id,
        agentId: userAgent?.id || null,
        success: success !== false,
        input: input ?? undefined,
        output: output ?? undefined,
        durationMs: typeof durationMs === 'number' ? durationMs : undefined,
        errorMessage: errorMessage || undefined,
      },
    });"""
content = content.replace(old_exec, new_exec)

open('src/app/api/skills/[slug]/execute/route.ts', 'w').write(content)
