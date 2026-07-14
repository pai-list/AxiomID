/**
 * @jest-environment node
 *
 * Tests for src/app/api/skills/tags/route.ts and src/app/api/skills/[slug]/tags/route.ts
 * Covers: GET /api/skills/tags, GET /api/skills/[slug]/tags, PUT /api/skills/[slug]/tags
 */

jest.mock("@/lib/auth-middleware", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    skill: {
      findUnique: jest.fn(),
    },
    skillTag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    skillTagRelation: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: {
    anonymous: { windowMs: 60000, maxRequests: 30 },
    authenticated: { windowMs: 60000, maxRequests: 20 },
  },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { GET as GET_TAGS } from "@/app/api/skills/tags/route";
import { GET as GET_SKILL_TAGS, PUT as PUT_SKILL_TAGS } from "@/app/api/skills/[slug]/tags/route";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { NextRequest } from "next/server";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGetClientIp = getClientIp as jest.Mock;

const mockUser = {
  id: "user-1",
  walletAddress: "pi:testuser",
  piUid: "pi-uid-1",
  piUsername: "testuser",
  xp: 0,
  tier: "Beginner",
};

function mockGetRequest(url: string) {
  return new NextRequest(url, { method: "GET" });
}

function mockPutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/skills/test-skill/tags", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// ─── GET /api/skills/tags ────────────────────────────────────────

describe("GET /api/skills/tags — rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockPrisma.skillTag.findMany.mockResolvedValue([]);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockGetRequest("http://localhost/api/skills/tags");
    const res = await GET_TAGS(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("uses RATE_LIMITS.anonymous config", async () => {
    const req = mockGetRequest("http://localhost/api/skills/tags");
    await GET_TAGS(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("skills-tags:"),
      RATE_LIMITS.anonymous
    );
  });
});

describe("GET /api/skills/tags — success responses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
  });

  it("returns tags with skill counts", async () => {
    const tags = [
      { id: "t1", name: "AI", slug: "ai", description: "Artificial Intelligence", color: "#3b82f6", createdAt: new Date(), _count: { skills: 5 } },
      { id: "t2", name: "Automation", slug: "automation", description: null, color: null, createdAt: new Date(), _count: { skills: 2 } },
    ];
    mockPrisma.skillTag.findMany.mockResolvedValue(tags);

    const req = mockGetRequest("http://localhost/api/skills/tags");
    const res = await GET_TAGS(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tags).toHaveLength(2);
    expect(data.tags[0].skillCount).toBe(5);
    expect(data.tags[1].skillCount).toBe(2);
  });

  it("returns empty array when no tags exist", async () => {
    mockPrisma.skillTag.findMany.mockResolvedValue([]);

    const req = mockGetRequest("http://localhost/api/skills/tags");
    const res = await GET_TAGS(req);
    const data = await res.json();

    expect(data.tags).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.skillTag.findMany.mockRejectedValue(new Error("DB down"));

    const req = mockGetRequest("http://localhost/api/skills/tags");
    const res = await GET_TAGS(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});

// ─── GET /api/skills/[slug]/tags ────────────────────────────────

describe("GET /api/skills/[slug]/tags — rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill" })
    mockPrisma.skillTagRelation.findMany.mockResolvedValue([]);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockGetRequest("http://localhost/api/skills/test-skill/tags");
    const res = await GET_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });
});

describe("GET /api/skills/[slug]/tags — business logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
  });

  it("returns 404 when skill not found", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const req = mockGetRequest("http://localhost/api/skills/nonexistent/tags");
    const res = await GET_SKILL_TAGS(req, { params: Promise.resolve({ slug: "nonexistent" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("returns tags for a skill", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill" })
    const relations = [
      { tag: { id: "t1", name: "AI", slug: "ai", description: "Artificial Intelligence", color: "#3b82f6" } },
      { tag: { id: "t2", name: "Automation", slug: "automation", description: null, color: null } },
    ];
    mockPrisma.skillTagRelation.findMany.mockResolvedValue(relations);

    const req = mockGetRequest("http://localhost/api/skills/test-skill/tags");
    const res = await GET_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tags).toHaveLength(2);
    expect(data.tags[0].name).toBe("AI");
    expect(data.tags[1].slug).toBe("automation");
  });

  it("returns empty array when skill has no tags", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill" })
    mockPrisma.skillTagRelation.findMany.mockResolvedValue([]);

    const req = mockGetRequest("http://localhost/api/skills/test-skill/tags");
    const res = await GET_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(data.tags).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.skill.findUnique.mockRejectedValue(new Error("DB down"));

    const req = mockGetRequest("http://localhost/api/skills/test-skill/tags");
    const res = await GET_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});

// ─── PUT /api/skills/[slug]/tags ────────────────────────────────

describe("PUT /api/skills/[slug]/tags — rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 0 });
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("rate limit check happens before auth", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockPutRequest({ tags: ["AI"] });
    await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });

    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
});

describe("PUT /api/skills/[slug]/tags — auth and validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it("returns 401 when authentication fails", async () => {
    const { apiError } = jest.requireActual("@/lib/errors") as { apiError: (code: string, message: string) => { status: number; json: () => Promise<unknown> } };
    mockRequireAuth.mockResolvedValue({ error: apiError("UNAUTHORIZED", "Unauthorized"), user: null });

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/skills/test-skill/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }) as unknown as NextRequest; // ponytail: test mock — intentionally malformed request body
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing tags array", async () => {
    const req = mockPutRequest({});
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when tags exceed 10", async () => {
    const req = mockPutRequest({ tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /api/skills/[slug]/tags — business logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.skillTag.createMany = jest.fn();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it("returns 404 when skill not found", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "nonexistent" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("returns 403 when user is not skill author", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "other-user" })

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
  });

  it("replaces tags for a skill", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "AI", slug: "ai" }, { id: "t2", name: "Automation", slug: "automation" }] as unknown as Awaited<ReturnType<typeof prisma.skillTag.findMany>>);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 2 });

    const req = mockPutRequest({ tags: ["AI", "Automation"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.skillTagRelation.deleteMany).toHaveBeenCalledWith({ where: { skillId: "s1" } });
    expect(mockPrisma.skillTagRelation.createMany).toHaveBeenCalled();
  });

  it("creates tags that don't exist", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "NewTag", slug: "newtag" }] as unknown as Awaited<ReturnType<typeof prisma.skillTag.findMany>>);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 1 });

    const req = mockPutRequest({ tags: ["NewTag"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.skillTag.createMany).toHaveBeenCalledWith({
      data: [{ name: "NewTag", slug: "newtag" }],
      skipDuplicates: true
    });
  });

  it("reuses existing tags", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValue([{ id: "t1", name: "AI", slug: "ai" }] as unknown as Awaited<ReturnType<typeof prisma.skillTag.findMany>>);

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.skillTag.createMany).not.toHaveBeenCalled();
  });

  it("generates slug from name via kebab-case", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "Machine Learning", slug: "machine-learning" }] as unknown as Awaited<ReturnType<typeof prisma.skillTag.findMany>>);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 1 });

    const req = mockPutRequest({ tags: ["Machine Learning"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.skillTag.createMany).toHaveBeenCalledWith({
      data: [{ name: "Machine Learning", slug: "machine-learning" }],
      skipDuplicates: true
    });
  });

  it("returns 500 on database error", async () => {
    mockPrisma.skill.findUnique.mockRejectedValue(new Error("DB down"));

    const req = mockPutRequest({ tags: ["AI"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });

  it("skips a whitespace-only tag name and does not create or link it", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "AI", slug: "ai" }]);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 1 });

    const req = mockPutRequest({ tags: ["AI", "   "] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.skillTag.createMany).toHaveBeenCalledTimes(1);
    expect(data.tagCount).toBe(1);
  });

  it("strips non-alphanumeric characters when generating a slug from the tag name", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" })
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "C++", slug: "c" }]);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 1 });

    const req = mockPutRequest({ tags: ["C++"] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });

    expect(res.status).toBe(200);
    expect(mockPrisma.skillTag.createMany).toHaveBeenCalledWith({
      data: [{ name: "C++", slug: "c" }],
      skipDuplicates: true
    });
  });

  it("ensures tags have non-empty unique slugs (ignores whitespace, symbols, and duplicates)", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", slug: "test-skill", authorId: "user-1" });
    mockPrisma.skillTagRelation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.skillTagRelation.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.skillTag.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: "t1", name: "AI", slug: "ai" }]);
    mockPrisma.skillTag.createMany.mockResolvedValue({ count: 1 });

    const req = mockPutRequest({ tags: ["AI", "   ", "!!!", "A.I."] });
    const res = await PUT_SKILL_TAGS(req, { params: Promise.resolve({ slug: "test-skill" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tagCount).toBe(1);
    expect(mockPrisma.skillTag.createMany).toHaveBeenCalledTimes(1);
  });
});